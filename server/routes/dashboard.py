from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from models import Expense, ExpenseParticipant, User
from schemas import (
    AnalyticsItem,
    CategoryBreakdown,
    CategoryTimeSeriesPoint,
    DashboardData,
    DashboardStats,
    ExpenseDashboardData,
    IncomeOverview,
    Order,
    PaidByBreakdown,
    PaymentMethodBreakdown,
    SplitSummary,
    StatCard,
    TimeSeriesPoint,
)
from utils.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _owner_user_id(user: User) -> int:
    return user.owner_user_id or user.id


def _is_sub_user(user: User) -> bool:
    return user.owner_user_id is not None and user.owner_user_id != user.id

STAT_CARDS = [
    StatCard(title="Total Page Views", count="4,42,236", percentage=59.3, extra="35,000"),
    StatCard(title="Total Users", count="78,250", percentage=70.5, extra="8,900"),
    StatCard(title="Total Order", count="18,800", percentage=27.4, isLoss=True, color="warning", extra="1,943"),
    StatCard(title="Total Sales", count="$35,078", percentage=27.4, isLoss=True, color="warning", extra="$20,395"),
]

RECENT_ORDERS = [
    Order(tracking_no=84564564, name="Camera Lens", fat=40, carbs=2, protein=40570),
    Order(tracking_no=98764564, name="Laptop", fat=300, carbs=0, protein=180139),
    Order(tracking_no=98756325, name="Mobile", fat=355, carbs=1, protein=90989),
]

ANALYTICS = [
    AnalyticsItem(label="Company Finance Growth", value="+45.14%"),
    AnalyticsItem(label="Company Expenses Ratio", value="0.58%"),
    AnalyticsItem(label="Business Risk Cases", value="Low"),
]

INCOME = IncomeOverview(weekly_income="$7,650", monthly_data=[80, 95, 70, 42, 65, 55, 78])


@router.get("", response_model=DashboardData)
def get_dashboard(current_user: User = Depends(get_current_user)):
    return DashboardData(
        stats=DashboardStats(cards=STAT_CARDS),
        recent_orders=RECENT_ORDERS,
        analytics=ANALYTICS,
        income=INCOME,
    )


@router.get("/stats", response_model=DashboardStats)
def get_stats(current_user: User = Depends(get_current_user)):
    return DashboardStats(cards=STAT_CARDS)


@router.get("/orders", response_model=List[Order])
def get_orders(current_user: User = Depends(get_current_user)):
    return RECENT_ORDERS


@router.get("/analytics", response_model=List[AnalyticsItem])
def get_analytics(current_user: User = Depends(get_current_user)):
    return ANALYTICS


@router.get("/income", response_model=IncomeOverview)
def get_income(current_user: User = Depends(get_current_user)):
    return INCOME


def _build_expense_dashboard_data(
    current_user: User,
    db: Session,
    expenses: list[Expense],
) -> ExpenseDashboardData:
    total = sum(e.amount for e in expenses)

    cat_map = defaultdict(lambda: {"total": 0.0, "count": 0})
    pm_map = defaultdict(lambda: {"total": 0.0, "count": 0})
    paid_by_map = defaultdict(lambda: {"total": 0.0, "count": 0})
    time_map = defaultdict(float)
    cat_time_map = defaultdict(lambda: defaultdict(float))

    for e in expenses:
        cat_map[e.category]["total"] += e.amount
        cat_map[e.category]["count"] += 1
        pm_map[e.payment_method]["total"] += e.amount
        pm_map[e.payment_method]["count"] += 1
        paid_by_map[e.paid_by_id]["total"] += e.amount
        paid_by_map[e.paid_by_id]["count"] += 1

        day_key = e.expense_date.strftime("%Y-%m-%d")
        time_map[day_key] += e.amount
        cat_time_map[day_key][e.category] += e.amount

    owner_user_id = _owner_user_id(current_user)
    actors = db.query(User).filter((User.id == owner_user_id) | (User.owner_user_id == owner_user_id)).all()
    actor_map = {u.id: u.name for u in actors}

    paid_totals = defaultdict(float)
    share_totals = defaultdict(float)
    for e in expenses:
        paid_totals[e.paid_by_id] += e.amount
        if e.consider_for_split:
            participants = db.query(ExpenseParticipant).filter(ExpenseParticipant.expense_id == e.id).all()
            if participants:
                share = e.amount / len(participants)
                for p in participants:
                    share_totals[p.person_id] += share

    all_ids = set(paid_totals.keys()) | set(share_totals.keys())

    # Backfill names for IDs that may exist in historical data but are not in the
    # default owner + owned people scope used above.
    missing_ids = [pid for pid in all_ids if pid not in actor_map]
    if missing_ids:
        extra_users = db.query(User).filter(User.id.in_(missing_ids)).all()
        actor_map.update({u.id: u.name for u in extra_users})

    def resolve_name(person_id: int) -> str:
        return actor_map.get(person_id) or f"User #{person_id}"

    return ExpenseDashboardData(
        total_expenses=round(total, 2),
        expense_count=len(expenses),
        category_breakdown=[
            CategoryBreakdown(category=k, total=round(v["total"], 2), count=v["count"])
            for k, v in cat_map.items()
        ],
        payment_method_breakdown=[
            PaymentMethodBreakdown(method=k, total=round(v["total"], 2), count=v["count"])
            for k, v in pm_map.items()
        ],
        paid_by_breakdown=[
            PaidByBreakdown(person_id=pid, person_name=resolve_name(pid), total=round(v["total"], 2), count=v["count"])
            for pid, v in paid_by_map.items()
        ],
        expenses_over_time=sorted(
            [TimeSeriesPoint(date=k, total=round(v, 2)) for k, v in time_map.items()],
            key=lambda x: x.date,
        ),
        category_over_time=sorted(
            [CategoryTimeSeriesPoint(date=day, categories={c: round(a, 2) for c, a in cats.items()}) for day, cats in cat_time_map.items()],
            key=lambda x: x.date,
        ),
        split_summary=[
            SplitSummary(
                person_id=pid,
                person_name=resolve_name(pid),
                total_paid=round(paid_totals.get(pid, 0.0), 2),
                total_share=round(share_totals.get(pid, 0.0), 2),
                net_balance=round(paid_totals.get(pid, 0.0) - share_totals.get(pid, 0.0), 2),
            )
            for pid in all_ids
        ],
    )


@router.get("/expenses", response_model=ExpenseDashboardData)
def get_expense_dashboard(
    period: str = Query("month"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if date_from and date_to:
        start = datetime.fromisoformat(date_from)
        end = datetime.fromisoformat(date_to).replace(hour=23, minute=59, second=59)
    else:
        now = datetime.now(timezone.utc)
        end = now
        if period == "week":
            start = now - timedelta(days=7)
        elif period == "year":
            start = now - timedelta(days=365)
        else:
            start = now - timedelta(days=30)

    owner_user_id = _owner_user_id(current_user)
    q = db.query(Expense).filter(Expense.user_id == owner_user_id, Expense.expense_date >= start)

    if _is_sub_user(current_user):
        participant_expense_ids = [
            ep.expense_id for ep in db.query(ExpenseParticipant).filter(ExpenseParticipant.person_id == current_user.id).all()
        ]
        q = q.filter(
            or_(
                Expense.paid_by_id == current_user.id,
                Expense.id.in_(participant_expense_ids) if participant_expense_ids else False,
            )
        )
    if date_from and date_to:
        q = q.filter(Expense.expense_date <= end)

    return _build_expense_dashboard_data(current_user, db, q.all())


@router.get("/my-expenses", response_model=ExpenseDashboardData)
def get_my_expense_dashboard(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    period: str = Query("month"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if date_from and date_to:
        start = datetime.fromisoformat(date_from)
        end = datetime.fromisoformat(date_to).replace(hour=23, minute=59, second=59)
    else:
        now = datetime.now(timezone.utc)
        end = now
        if period == "week":
            start = now - timedelta(days=7)
        elif period == "year":
            start = now - timedelta(days=365)
        else:
            start = now - timedelta(days=30)

    owner_user_id = _owner_user_id(current_user)

    participant_expense_ids = [
        ep.expense_id for ep in db.query(ExpenseParticipant).filter(ExpenseParticipant.person_id == current_user.id).all()
    ]

    q = db.query(Expense).filter(
        Expense.user_id == owner_user_id,
        Expense.expense_date >= start,
        or_(
            Expense.paid_by_id == current_user.id,
            Expense.id.in_(participant_expense_ids) if participant_expense_ids else False,
        ),
    )
    if date_from and date_to:
        q = q.filter(Expense.expense_date <= end)

    return _build_expense_dashboard_data(current_user, db, q.all())
