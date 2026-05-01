import json
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta

from sqlalchemy.orm import Session

from models import Expense, ExpenseParticipant, ExpenseTag, RecurringRule


def _next_date(current: datetime, frequency: str) -> datetime:
    if frequency == "daily":
        return current + timedelta(days=1)
    elif frequency == "weekly":
        return current + timedelta(weeks=1)
    elif frequency == "monthly":
        return current + relativedelta(months=1)
    elif frequency == "yearly":
        return current + relativedelta(years=1)
    return current + timedelta(days=1)


def generate_expense_from_rule(
    db: Session,
    rule: RecurringRule,
    for_date: datetime | None = None,
    paid_by_id: int | None = None,
    tag_ids: list[int] | None = None,
) -> None:
    """Generate a single expense from a recurring rule at the given date (defaults to now)."""
    now = for_date if for_date is not None else datetime.utcnow()
    expense = Expense(
        user_id=rule.user_id,
        title=rule.title,
        amount=rule.amount,
        category=rule.category,
        payment_method=rule.payment_method,
        paid_by_id=paid_by_id if paid_by_id is not None else rule.paid_by_id,
        consider_for_split=rule.consider_for_split,
        expense_date=now,
        notes=rule.notes,
        recurring_rule_id=rule.id,
    )
    db.add(expense)
    db.flush()

    participant_ids = json.loads(rule.participant_ids_json) if rule.participant_ids_json else []
    for pid in participant_ids:
        db.add(ExpenseParticipant(expense_id=expense.id, person_id=pid))

    if tag_ids:
        for tid in tag_ids:
            db.add(ExpenseTag(expense_id=expense.id, tag_id=tid))

    rule.last_generated_date = now
    db.commit()


def generate_expenses_from_rule_in_range(
    db: Session,
    rule: RecurringRule,
    start_date: datetime,
    end_date: datetime,
    paid_by_id: int | None = None,
    tag_ids: list[int] | None = None,
) -> int:
    """Generate recurring expenses from start_date to end_date (inclusive) using rule frequency."""
    if end_date < start_date:
        return 0

    range_start = max(start_date, rule.start_date)
    range_end = min(end_date, rule.end_date) if rule.end_date else end_date
    if range_end < range_start:
        return 0

    count = 0
    current = range_start
    while current <= range_end:
        generate_expense_from_rule(
            db,
            rule,
            for_date=current,
            paid_by_id=paid_by_id,
            tag_ids=tag_ids,
        )
        count += 1

        next_date = _next_date(current, rule.frequency)
        if next_date <= current:
            break
        current = next_date

    return count


def process_recurring_rules(db: Session) -> int:
    """Check all active rules and generate any due expenses. Returns count generated."""
    now = datetime.utcnow()
    rules = db.query(RecurringRule).filter(
        RecurringRule.is_active == True,  # noqa: E712
        RecurringRule.start_date <= now,
    ).all()

    count = 0
    for rule in rules:
        if rule.end_date and rule.end_date < now:
            continue

        if rule.last_generated_date is None:
            # Never generated - create first expense
            generate_expense_from_rule(db, rule)
            count += 1
        else:
            # Check if next occurrence is due
            next_due = _next_date(rule.last_generated_date, rule.frequency)
            while next_due <= now:
                if rule.end_date and next_due > rule.end_date:
                    break
                generate_expense_from_rule(db, rule)
                count += 1
                next_due = _next_date(rule.last_generated_date, rule.frequency)

    return count
