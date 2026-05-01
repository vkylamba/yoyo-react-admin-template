import os
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import false, or_
from sqlalchemy.orm import Session

from database import get_db
from models import Expense, ExpenseParticipant, ExpenseTag, Tag, Trip, User
from schemas import (
    EXPENSE_CATEGORIES,
    PAYMENT_METHODS,
    ExpenseCreate,
    ExpenseListResponse,
    ExpenseOut,
    ExpenseUpdate,
    MessageResponse,
    ParticipantOut,
    TagOut,
)
from utils.security import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


def _owner_user_id(user: User) -> int:
    return user.owner_user_id or user.id


def _is_sub_user(user: User) -> bool:
    return user.owner_user_id is not None and user.owner_user_id != user.id


def _build_expense_out(expense: Expense, db: Session) -> ExpenseOut:
    paid_by = db.query(User).filter(User.id == expense.paid_by_id).first()
    participants = db.query(ExpenseParticipant).filter(
        ExpenseParticipant.expense_id == expense.id
    ).all()
    participant_list = []
    for p in participants:
        person = db.query(User).filter(User.id == p.person_id).first()
        participant_list.append(ParticipantOut(
            id=p.id,
            person_id=p.person_id,
            person_name=person.name if person else "Unknown",
        ))

    attachment_url = None
    if expense.attachment_filename:
        attachment_url = f"/api/uploads/{expense.user_id}/{expense.attachment_filename}"

    # Tags
    expense_tags = db.query(ExpenseTag).filter(ExpenseTag.expense_id == expense.id).all()
    tag_list = []
    for et in expense_tags:
        tag = db.query(Tag).filter(Tag.id == et.tag_id, Tag.user_id == expense.user_id).first()
        if tag:
            tag_list.append(TagOut.model_validate(tag))

    # Trip
    trip_name = None
    if expense.trip_id:
        trip = db.query(Trip).filter(Trip.id == expense.trip_id).first()
        if trip:
            trip_name = trip.name

    return ExpenseOut(
        id=expense.id,
        title=expense.title,
        amount=expense.amount,
        category=expense.category,
        payment_method=expense.payment_method,
        paid_by_id=expense.paid_by_id,
        paid_by_name=paid_by.name if paid_by else "Unknown",
        consider_for_split=expense.consider_for_split,
        is_private=expense.is_private,
        attachment_filename=expense.attachment_filename,
        attachment_url=attachment_url,
        expense_date=expense.expense_date.isoformat(),
        notes=expense.notes,
        participants=participant_list,
        tags=tag_list,
        trip_id=expense.trip_id,
        trip_name=trip_name,
        recurring_rule_id=expense.recurring_rule_id,
        created_at=expense.created_at.isoformat(),
    )


@router.get("", response_model=ExpenseListResponse)
def list_expenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    payment_method: Optional[str] = None,
    paid_by_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    tag_id: Optional[int] = None,
    trip_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    owner_user_id = _owner_user_id(current_user)
    q = db.query(Expense).filter(Expense.user_id == owner_user_id)

    if _is_sub_user(current_user):
        participant_expense_ids = [
            ep.expense_id for ep in db.query(ExpenseParticipant).filter(ExpenseParticipant.person_id == current_user.id).all()
        ]
        q = q.filter(
            or_(
                Expense.paid_by_id == current_user.id,
                Expense.id.in_(participant_expense_ids) if participant_expense_ids else false(),
            )
        )

    if category:
        q = q.filter(Expense.category == category)
    if payment_method:
        q = q.filter(Expense.payment_method == payment_method)
    if paid_by_id:
        q = q.filter(Expense.paid_by_id == paid_by_id)
    if date_from:
        q = q.filter(Expense.expense_date >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.filter(Expense.expense_date <= datetime.fromisoformat(date_to))
    if tag_id:
        expense_ids = [
            et.expense_id
            for et in db.query(ExpenseTag)
            .join(Tag, Tag.id == ExpenseTag.tag_id)
            .filter(ExpenseTag.tag_id == tag_id, Tag.user_id == owner_user_id)
            .all()
        ]
        q = q.filter(Expense.id.in_(expense_ids))
    if trip_id:
        q = q.filter(Expense.trip_id == trip_id)
    if search:
        q = q.filter(or_(
            Expense.title.ilike(f"%{search}%"),
            Expense.notes.ilike(f"%{search}%"),
        ))

    total = q.count()
    expenses = q.order_by(Expense.expense_date.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return ExpenseListResponse(
        items=[_build_expense_out(e, db) for e in expenses],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/my", response_model=ExpenseListResponse)
def my_expenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Expenses where current user paid or is a participant."""
    from routes.people import _ensure_self
    _ensure_self(db, current_user)
    self_person = db.query(User).filter(User.id == current_user.id).first()
    if not self_person:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    owner_user_id = _owner_user_id(current_user)

    # Find expense IDs where self is a participant
    participant_expense_ids = [
        ep.expense_id for ep in
        db.query(ExpenseParticipant).filter(ExpenseParticipant.person_id == self_person.id).all()
    ]

    # Expenses where self paid OR self is participant
    q = db.query(Expense).filter(
        Expense.user_id == owner_user_id,
        or_(
            Expense.paid_by_id == self_person.id,
            Expense.id.in_(participant_expense_ids) if participant_expense_ids else false(),
        ),
    )

    if category:
        q = q.filter(Expense.category == category)
    if date_from:
        q = q.filter(Expense.expense_date >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.filter(Expense.expense_date <= datetime.fromisoformat(date_to))

    total = q.count()
    expenses = q.order_by(Expense.expense_date.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return ExpenseListResponse(
        items=[_build_expense_out(e, db) for e in expenses],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    owner_user_id = _owner_user_id(current_user)
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == owner_user_id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    if _is_sub_user(current_user):
        involved = expense.paid_by_id == current_user.id or db.query(ExpenseParticipant).filter(
            ExpenseParticipant.expense_id == expense.id,
            ExpenseParticipant.person_id == current_user.id,
        ).first() is not None
        if not involved:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    return _build_expense_out(expense, db)


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    body: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.category not in EXPENSE_CATEGORIES:
        raise HTTPException(status_code=422, detail=f"Invalid category. Must be one of: {EXPENSE_CATEGORIES}")
    if body.payment_method not in PAYMENT_METHODS:
        raise HTTPException(status_code=422, detail=f"Invalid payment method. Must be one of: {PAYMENT_METHODS}")

    owner_user_id = _owner_user_id(current_user)

    if body.tag_ids:
        valid_tag_count = db.query(Tag).filter(
            Tag.user_id == owner_user_id,
            Tag.id.in_(body.tag_ids),
        ).count()
        if valid_tag_count != len(set(body.tag_ids)):
            raise HTTPException(status_code=422, detail="Invalid tag_ids")

    # Private expenses: force split off, only self as participant
    is_private = body.is_private
    participant_ids = body.participant_ids
    consider_for_split = body.consider_for_split
    if is_private:
        consider_for_split = False
        participant_ids = []

    expense = Expense(
        user_id=owner_user_id,
        title=body.title,
        amount=body.amount,
        category=body.category,
        payment_method=body.payment_method,
        paid_by_id=body.paid_by_id,
        consider_for_split=consider_for_split,
        is_private=is_private,
        expense_date=datetime.fromisoformat(body.expense_date),
        notes=body.notes,
        trip_id=body.trip_id,
    )
    db.add(expense)
    db.flush()

    for pid in participant_ids:
        db.add(ExpenseParticipant(expense_id=expense.id, person_id=pid))
    for tid in body.tag_ids:
        db.add(ExpenseTag(expense_id=expense.id, tag_id=tid))

    db.commit()
    db.refresh(expense)

    from utils.notifications import notify_expense_participants
    notify_expense_participants(db, expense, action="created")

    return _build_expense_out(expense, db)


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    body: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    if body.category is not None:
        if body.category not in EXPENSE_CATEGORIES:
            raise HTTPException(status_code=422, detail=f"Invalid category")
        expense.category = body.category
    if body.payment_method is not None:
        if body.payment_method not in PAYMENT_METHODS:
            raise HTTPException(status_code=422, detail=f"Invalid payment method")
        expense.payment_method = body.payment_method
    if body.title is not None:
        expense.title = body.title
    if body.amount is not None:
        expense.amount = body.amount
    if body.paid_by_id is not None:
        expense.paid_by_id = body.paid_by_id
    if body.is_private is not None:
        expense.is_private = body.is_private
        if body.is_private:
            expense.consider_for_split = False
            db.query(ExpenseParticipant).filter(
                ExpenseParticipant.expense_id == expense.id
            ).delete()
    if body.consider_for_split is not None and not expense.is_private:
        expense.consider_for_split = body.consider_for_split
    if body.expense_date is not None:
        expense.expense_date = datetime.fromisoformat(body.expense_date)
    if body.notes is not None:
        expense.notes = body.notes

    if body.trip_id is not None:
        expense.trip_id = body.trip_id

    if body.participant_ids is not None:
        db.query(ExpenseParticipant).filter(
            ExpenseParticipant.expense_id == expense.id
        ).delete()
        for pid in body.participant_ids:
            db.add(ExpenseParticipant(expense_id=expense.id, person_id=pid))

    if body.tag_ids is not None:
        if body.tag_ids:
            valid_tag_count = db.query(Tag).filter(
                Tag.user_id == current_user.id,
                Tag.id.in_(body.tag_ids),
            ).count()
            if valid_tag_count != len(set(body.tag_ids)):
                raise HTTPException(status_code=422, detail="Invalid tag_ids")

        db.query(ExpenseTag).filter(ExpenseTag.expense_id == expense.id).delete()
        for tid in body.tag_ids:
            db.add(ExpenseTag(expense_id=expense.id, tag_id=tid))

    db.commit()
    db.refresh(expense)

    from utils.notifications import notify_expense_participants
    notify_expense_participants(db, expense, action="updated")

    return _build_expense_out(expense, db)


@router.delete("/{expense_id}", response_model=MessageResponse)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    # Remove attachment file if exists
    if expense.attachment_filename:
        filepath = os.path.join(UPLOAD_DIR, str(current_user.id), expense.attachment_filename)
        if os.path.exists(filepath):
            os.remove(filepath)

    db.query(ExpenseParticipant).filter(ExpenseParticipant.expense_id == expense.id).delete()
    db.query(ExpenseTag).filter(ExpenseTag.expense_id == expense.id).delete()
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}


@router.post("/{expense_id}/attachment", response_model=ExpenseOut)
def upload_attachment(
    expense_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    user_dir = os.path.join(UPLOAD_DIR, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)

    # Remove old attachment if exists
    if expense.attachment_filename:
        old_path = os.path.join(user_dir, expense.attachment_filename)
        if os.path.exists(old_path):
            os.remove(old_path)

    filename = f"{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join(user_dir, filename)
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    expense.attachment_filename = filename
    db.commit()
    db.refresh(expense)
    return _build_expense_out(expense, db)


@router.delete("/{expense_id}/attachment", response_model=ExpenseOut)
def delete_attachment(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id, Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    if expense.attachment_filename:
        filepath = os.path.join(UPLOAD_DIR, str(current_user.id), expense.attachment_filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        expense.attachment_filename = None
        db.commit()
        db.refresh(expense)

    return _build_expense_out(expense, db)
