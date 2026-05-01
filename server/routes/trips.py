from collections import defaultdict
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Expense, ExpenseParticipant, ExpenseTag, Tag, Trip, User
from schemas import (
    CategoryBreakdown,
    ExpenseDashboardData,
    CategoryTimeSeriesPoint,
    MessageResponse,
    PaidByBreakdown,
    PaymentMethodBreakdown,
    SplitSummary,
    TagOut,
    TimeSeriesPoint,
    TripCreate,
    TripExpensesRequest,
    TripOut,
    TripUpdate,
)
from utils.security import get_current_user

router = APIRouter(prefix="/trips", tags=["trips"])


def _build_trip_out(trip: Trip, db: Session) -> TripOut:
    count = db.query(func.count(Expense.id)).filter(Expense.trip_id == trip.id).scalar() or 0
    total = db.query(func.coalesce(func.sum(Expense.amount), 0.0)).filter(Expense.trip_id == trip.id).scalar()
    return TripOut(
        id=trip.id,
        name=trip.name,
        description=trip.description,
        start_date=trip.start_date.isoformat() if trip.start_date else None,
        end_date=trip.end_date.isoformat() if trip.end_date else None,
        expense_count=count,
        total_amount=round(float(total), 2),
        created_at=trip.created_at.isoformat(),
    )


@router.get("", response_model=List[TripOut])
def list_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).order_by(Trip.created_at.desc()).all()
    return [_build_trip_out(t, db) for t in trips]


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return _build_trip_out(trip, db)


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(
    body: TripCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = Trip(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        start_date=datetime.fromisoformat(body.start_date) if body.start_date else None,
        end_date=datetime.fromisoformat(body.end_date) if body.end_date else None,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return _build_trip_out(trip, db)


@router.put("/{trip_id}", response_model=TripOut)
def update_trip(
    trip_id: int,
    body: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if body.name is not None:
        trip.name = body.name
    if body.description is not None:
        trip.description = body.description
    if body.start_date is not None:
        trip.start_date = datetime.fromisoformat(body.start_date)
    if body.end_date is not None:
        trip.end_date = datetime.fromisoformat(body.end_date)
    db.commit()
    db.refresh(trip)
    return _build_trip_out(trip, db)


@router.delete("/{trip_id}", response_model=MessageResponse)
def delete_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    # Unlink expenses, don't delete them
    db.query(Expense).filter(Expense.trip_id == trip.id).update({"trip_id": None})
    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted"}


@router.post("/{trip_id}/expenses", response_model=MessageResponse)
def add_expenses_to_trip(
    trip_id: int,
    body: TripExpensesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    db.query(Expense).filter(
        Expense.id.in_(body.expense_ids),
        Expense.user_id == current_user.id,
    ).update({"trip_id": trip.id}, synchronize_session="fetch")
    db.commit()
    return {"message": f"{len(body.expense_ids)} expense(s) added to trip"}


@router.delete("/{trip_id}/expenses/{expense_id}", response_model=MessageResponse)
def remove_expense_from_trip(
    trip_id: int,
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.trip_id == trip_id,
        Expense.user_id == current_user.id,
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found in this trip")
    expense.trip_id = None
    db.commit()
    return {"message": "Expense removed from trip"}


@router.get("/{trip_id}/dashboard", response_model=ExpenseDashboardData)
def get_trip_dashboard(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    expenses = db.query(Expense).filter(Expense.trip_id == trip.id).all()
    total = sum(e.amount for e in expenses)

    # Category breakdown
    cat_map = defaultdict(lambda: {"total": 0.0, "count": 0})
    for e in expenses:
        cat_map[e.category]["total"] += e.amount
        cat_map[e.category]["count"] += 1
    category_breakdown = [
        CategoryBreakdown(category=k, total=round(v["total"], 2), count=v["count"])
        for k, v in cat_map.items()
    ]

    # Payment method breakdown
    pm_map = defaultdict(lambda: {"total": 0.0, "count": 0})
    for e in expenses:
        pm_map[e.payment_method]["total"] += e.amount
        pm_map[e.payment_method]["count"] += 1
    payment_breakdown = [
        PaymentMethodBreakdown(method=k, total=round(v["total"], 2), count=v["count"])
        for k, v in pm_map.items()
    ]

    # Paid by breakdown
    paid_by_map = defaultdict(lambda: {"total": 0.0, "count": 0})
    for e in expenses:
        paid_by_map[e.paid_by_id]["total"] += e.amount
        paid_by_map[e.paid_by_id]["count"] += 1

    people = db.query(User).filter((User.id == current_user.id) | (User.owner_user_id == current_user.id)).all()
    person_map = {p.id: p.name for p in people}

    paid_by_breakdown = [
        PaidByBreakdown(person_id=pid, person_name=person_map.get(pid, "Unknown"), total=round(v["total"], 2), count=v["count"])
        for pid, v in paid_by_map.items()
    ]

    # Expenses over time
    time_map = defaultdict(float)
    cat_time_map = defaultdict(lambda: defaultdict(float))
    for e in expenses:
        day_key = e.expense_date.strftime("%Y-%m-%d")
        time_map[day_key] += e.amount
        cat_time_map[day_key][e.category] += e.amount
    expenses_over_time = sorted(
        [TimeSeriesPoint(date=k, total=round(v, 2)) for k, v in time_map.items()],
        key=lambda x: x.date,
    )
    category_over_time = sorted(
        [CategoryTimeSeriesPoint(date=day, categories={c: round(a, 2) for c, a in cats.items()})
         for day, cats in cat_time_map.items()],
        key=lambda x: x.date,
    )

    # Split summary
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
    split_summary = [
        SplitSummary(
            person_id=pid, person_name=person_map.get(pid, "Unknown"),
            total_paid=round(paid_totals.get(pid, 0.0), 2),
            total_share=round(share_totals.get(pid, 0.0), 2),
            net_balance=round(paid_totals.get(pid, 0.0) - share_totals.get(pid, 0.0), 2),
        )
        for pid in all_ids
    ]

    return ExpenseDashboardData(
        total_expenses=round(total, 2),
        expense_count=len(expenses),
        category_breakdown=category_breakdown,
        payment_method_breakdown=payment_breakdown,
        paid_by_breakdown=paid_by_breakdown,
        expenses_over_time=expenses_over_time,
        category_over_time=category_over_time,
        split_summary=split_summary,
    )
