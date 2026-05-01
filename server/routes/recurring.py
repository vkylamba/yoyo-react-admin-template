import json
from datetime import datetime
from typing import List, Optional
from dateutil.parser import parse as parse_date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import RecurringRule, Tag, User
from schemas import (
    EXPENSE_CATEGORIES,
    FREQUENCIES,
    PAYMENT_METHODS,
    MessageResponse,
    RecurringRuleCreate,
    RecurringRuleOut,
    RecurringRuleUpdate,
)
from utils.security import get_current_user

router = APIRouter(prefix="/recurring", tags=["recurring"])


def _build_rule_out(rule: RecurringRule, db: Session) -> RecurringRuleOut:
    paid_by = db.query(User).filter(User.id == rule.paid_by_id).first()
    participant_ids = json.loads(rule.participant_ids_json) if rule.participant_ids_json else []
    return RecurringRuleOut(
        id=rule.id,
        title=rule.title,
        amount=rule.amount,
        category=rule.category,
        payment_method=rule.payment_method,
        paid_by_id=rule.paid_by_id,
        paid_by_name=paid_by.name if paid_by else "Unknown",
        participant_ids=participant_ids,
        consider_for_split=rule.consider_for_split,
        notes=rule.notes,
        frequency=rule.frequency,
        start_date=rule.start_date.isoformat(),
        end_date=rule.end_date.isoformat() if rule.end_date else None,
        is_active=rule.is_active,
        last_generated_date=rule.last_generated_date.isoformat() if rule.last_generated_date else None,
        created_at=rule.created_at.isoformat(),
    )


@router.get("", response_model=List[RecurringRuleOut])
def list_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rules = db.query(RecurringRule).filter(RecurringRule.user_id == current_user.id).all()
    return [_build_rule_out(r, db) for r in rules]


@router.get("/{rule_id}", response_model=RecurringRuleOut)
def get_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rule = db.query(RecurringRule).filter(
        RecurringRule.id == rule_id, RecurringRule.user_id == current_user.id
    ).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    return _build_rule_out(rule, db)


@router.post("", response_model=RecurringRuleOut, status_code=status.HTTP_201_CREATED)
def create_rule(
    body: RecurringRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.category not in EXPENSE_CATEGORIES:
        raise HTTPException(status_code=422, detail="Invalid category")
    if body.payment_method not in PAYMENT_METHODS:
        raise HTTPException(status_code=422, detail="Invalid payment method")
    if body.frequency not in FREQUENCIES:
        raise HTTPException(status_code=422, detail="Invalid frequency")

    rule = RecurringRule(
        user_id=current_user.id,
        title=body.title,
        amount=body.amount,
        category=body.category,
        payment_method=body.payment_method,
        paid_by_id=body.paid_by_id,
        consider_for_split=body.consider_for_split,
        participant_ids_json=json.dumps(body.participant_ids),
        notes=body.notes,
        frequency=body.frequency,
        start_date=datetime.fromisoformat(body.start_date),
        end_date=datetime.fromisoformat(body.end_date) if body.end_date else None,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return _build_rule_out(rule, db)


@router.put("/{rule_id}", response_model=RecurringRuleOut)
def update_rule(
    rule_id: int,
    body: RecurringRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rule = db.query(RecurringRule).filter(
        RecurringRule.id == rule_id, RecurringRule.user_id == current_user.id
    ).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")

    if body.title is not None:
        rule.title = body.title
    if body.amount is not None:
        rule.amount = body.amount
    if body.category is not None:
        if body.category not in EXPENSE_CATEGORIES:
            raise HTTPException(status_code=422, detail="Invalid category")
        rule.category = body.category
    if body.payment_method is not None:
        if body.payment_method not in PAYMENT_METHODS:
            raise HTTPException(status_code=422, detail="Invalid payment method")
        rule.payment_method = body.payment_method
    if body.paid_by_id is not None:
        rule.paid_by_id = body.paid_by_id
    if body.consider_for_split is not None:
        rule.consider_for_split = body.consider_for_split
    if body.participant_ids is not None:
        rule.participant_ids_json = json.dumps(body.participant_ids)
    if body.notes is not None:
        rule.notes = body.notes
    if body.frequency is not None:
        if body.frequency not in FREQUENCIES:
            raise HTTPException(status_code=422, detail="Invalid frequency")
        rule.frequency = body.frequency
    if body.start_date is not None:
        rule.start_date = datetime.fromisoformat(body.start_date)
    if body.end_date is not None:
        rule.end_date = datetime.fromisoformat(body.end_date)
    if body.is_active is not None:
        rule.is_active = body.is_active

    db.commit()
    db.refresh(rule)
    return _build_rule_out(rule, db)


@router.delete("/{rule_id}", response_model=MessageResponse)
def delete_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rule = db.query(RecurringRule).filter(
        RecurringRule.id == rule_id, RecurringRule.user_id == current_user.id
    ).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted"}


@router.post("/{rule_id}/trigger", response_model=MessageResponse)
def trigger_rule(
    rule_id: int,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    paid_by_id: Optional[int] = None,
    tag_ids: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rule = db.query(RecurringRule).filter(
        RecurringRule.id == rule_id, RecurringRule.user_id == current_user.id
    ).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")

    allowed_people = db.query(User).filter(
        (User.id == current_user.id) | (User.owner_user_id == current_user.id)
    ).all()
    allowed_people_ids = {p.id for p in allowed_people}

    effective_paid_by_id = paid_by_id if paid_by_id is not None else rule.paid_by_id
    if effective_paid_by_id not in allowed_people_ids:
        raise HTTPException(status_code=422, detail="Invalid paid_by_id")

    parsed_tag_ids: list[int] = []
    if tag_ids:
        try:
            parsed_tag_ids = [int(t.strip()) for t in tag_ids.split(",") if t.strip()]
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid tag_ids format")

        if parsed_tag_ids:
            valid_tags_count = db.query(Tag).filter(
                Tag.user_id == current_user.id,
                Tag.id.in_(parsed_tag_ids),
            ).count()
            if valid_tags_count != len(set(parsed_tag_ids)):
                raise HTTPException(status_code=422, detail="Invalid tag_ids")

    if start_date or end_date:
        if not start_date or not end_date:
            raise HTTPException(status_code=422, detail="Both start_date and end_date are required")
        try:
            range_start = parse_date(start_date)
            range_end = parse_date(end_date)
        except (ValueError, OverflowError):
            raise HTTPException(status_code=422, detail="Invalid start_date or end_date format")
        if range_end < range_start:
            raise HTTPException(status_code=422, detail="end_date must be on or after start_date")

        from utils.recurring import generate_expenses_from_rule_in_range

        count = generate_expenses_from_rule_in_range(
            db,
            rule,
            start_date=range_start,
            end_date=range_end,
            paid_by_id=effective_paid_by_id,
            tag_ids=parsed_tag_ids,
        )
        return {"message": f"Generated {count} expense(s) from rule"}

    for_date = None
    if date:
        try:
            for_date = parse_date(date)
        except (ValueError, OverflowError):
            raise HTTPException(status_code=422, detail="Invalid date format")

    from utils.recurring import generate_expense_from_rule

    generate_expense_from_rule(
        db,
        rule,
        for_date=for_date,
        paid_by_id=effective_paid_by_id,
        tag_ids=parsed_tag_ids,
    )
    return {"message": "Expense generated from rule"}
