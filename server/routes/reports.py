from calendar import monthrange
from datetime import datetime, timezone
from email.message import EmailMessage
import smtplib
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from config import (
    SMTP_FROM_EMAIL,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USE_SSL,
    SMTP_USE_TLS,
    SMTP_USERNAME,
)
from database import get_db
from models import Expense, ExpenseParticipant, ReportSubscription, User
from schemas import (
    CategoryBreakdown,
    MessageResponse,
    MonthlyReportData,
    PaymentMethodBreakdown,
    ReportEmailPreviewOut,
    ReportSubscriptionOut,
    ReportSubscriptionUpsert,
    SplitSummary,
)
from utils.security import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


def build_monthly_report_data(db: Session, user_id: int, month: int, year: int) -> MonthlyReportData:
    start = datetime(year, month, 1)
    _, last_day = monthrange(year, month)
    end = datetime(year, month, last_day, 23, 59, 59)

    expenses = db.query(Expense).filter(
        Expense.user_id == user_id,
        Expense.expense_date >= start,
        Expense.expense_date <= end,
    ).all()

    total = sum(e.amount for e in expenses)

    # Category breakdown
    cat_map = {}
    for e in expenses:
        if e.category not in cat_map:
            cat_map[e.category] = {"total": 0.0, "count": 0}
        cat_map[e.category]["total"] += e.amount
        cat_map[e.category]["count"] += 1
    category_breakdown = [
        CategoryBreakdown(category=k, total=round(v["total"], 2), count=v["count"])
        for k, v in cat_map.items()
    ]

    # Payment method breakdown
    pm_map = {}
    for e in expenses:
        if e.payment_method not in pm_map:
            pm_map[e.payment_method] = {"total": 0.0, "count": 0}
        pm_map[e.payment_method]["total"] += e.amount
        pm_map[e.payment_method]["count"] += 1
    payment_breakdown = [
        PaymentMethodBreakdown(method=k, total=round(v["total"], 2), count=v["count"])
        for k, v in pm_map.items()
    ]

    # Person breakdown (split summary)
    people = db.query(User).filter((User.id == user_id) | (User.owner_user_id == user_id)).all()
    person_map = {p.id: p.name for p in people}
    paid_totals = {}
    share_totals = {}

    for e in expenses:
        paid_totals[e.paid_by_id] = paid_totals.get(e.paid_by_id, 0.0) + e.amount

        if e.consider_for_split:
            participants = db.query(ExpenseParticipant).filter(
                ExpenseParticipant.expense_id == e.id
            ).all()
            if participants:
                share = e.amount / len(participants)
                for p in participants:
                    share_totals[p.person_id] = share_totals.get(p.person_id, 0.0) + share

    all_person_ids = set(paid_totals.keys()) | set(share_totals.keys())
    person_breakdown = [
        SplitSummary(
            person_id=pid,
            person_name=person_map.get(pid, "Unknown"),
            total_paid=round(paid_totals.get(pid, 0.0), 2),
            total_share=round(share_totals.get(pid, 0.0), 2),
            net_balance=round(paid_totals.get(pid, 0.0) - share_totals.get(pid, 0.0), 2),
        )
        for pid in all_person_ids
    ]

    return MonthlyReportData(
        month=month,
        year=year,
        total_expenses=round(total, 2),
        category_breakdown=category_breakdown,
        payment_method_breakdown=payment_breakdown,
        person_breakdown=person_breakdown,
    )


@router.get("/monthly", response_model=MonthlyReportData)
def monthly_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return build_monthly_report_data(db, current_user.id, month, year)


def build_report_email_preview(
    db: Session,
    current_user: User,
    month: Optional[int],
    year: Optional[int],
) -> ReportEmailPreviewOut:
    now = datetime.now(timezone.utc)
    report_month = month or now.month
    report_year = year or now.year

    subscription = db.query(ReportSubscription).filter(
        ReportSubscription.user_id == current_user.id
    ).first()
    to_email = subscription.email if subscription and subscription.email else current_user.email

    report = build_monthly_report_data(db, current_user.id, report_month, report_year)

    category_lines = "\n".join(
        f"- {item.category}: ${item.total:.2f} ({item.count} entries)"
        for item in report.category_breakdown
    ) or "- No expenses recorded"

    body = (
        f"Hello {current_user.firstname},\n\n"
        f"This is a test preview of your monthly expense report email for {report.month:02d}/{report.year}.\n\n"
        f"Total expenses: ${report.total_expenses:.2f}\n"
        f"Categories:\n{category_lines}\n\n"
        "This is a preview only. No real email was sent."
    )

    return ReportEmailPreviewOut(
        to_email=to_email,
        subject=f"Monthly Expense Report Preview - {report.month:02d}/{report.year}",
        body=body,
        month=report.month,
        year=report.year,
    )


@router.post("/subscription/test", response_model=ReportEmailPreviewOut)
def test_subscription_email(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return build_report_email_preview(db, current_user, month, year)


@router.post("/subscription/test-send", response_model=MessageResponse)
def send_test_subscription_email(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not SMTP_HOST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMTP is not configured. Set SMTP_HOST and related SMTP_* env vars.",
        )

    preview = build_report_email_preview(db, current_user, month, year)

    message = EmailMessage()
    message["Subject"] = preview.subject
    message["From"] = SMTP_FROM_EMAIL or current_user.email
    message["To"] = preview.to_email
    message.set_content(preview.body)

    try:
        if SMTP_USE_SSL:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                if SMTP_USERNAME:
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(message)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                if SMTP_USE_TLS:
                    server.starttls()
                if SMTP_USERNAME:
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(message)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send test email: {exc}",
        ) from exc

    return {"message": f"Test email sent to {preview.to_email}"}


@router.get("/subscription", response_model=ReportSubscriptionOut)
def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(ReportSubscription).filter(
        ReportSubscription.user_id == current_user.id
    ).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No subscription found")
    return sub


@router.post("/subscription", response_model=ReportSubscriptionOut)
def upsert_subscription(
    body: ReportSubscriptionUpsert,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(ReportSubscription).filter(
        ReportSubscription.user_id == current_user.id
    ).first()
    if sub:
        sub.is_active = body.is_active
        sub.email = body.email
        sub.day_of_month = body.day_of_month
    else:
        sub = ReportSubscription(
            user_id=current_user.id,
            is_active=body.is_active,
            email=body.email,
            day_of_month=body.day_of_month,
        )
        db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub
