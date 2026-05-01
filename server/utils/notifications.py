from sqlalchemy.orm import Session

from models import Expense, ExpenseParticipant, Notification, User


def notify_expense_participants(
    db: Session,
    expense: Expense,
    action: str = "created",
):
    """Create notifications for people involved in an expense.

    Notifies participants and the person who paid (if different from the creator).
    The current user (expense.user_id) is NOT notified about their own action.
    """
    # Get the self user for the expense owner
    self_person = db.query(User).filter(User.id == expense.user_id).first()
    if not self_person:
        return

    paid_by = db.query(User).filter(User.id == expense.paid_by_id).first()
    paid_by_name = paid_by.name if paid_by else "Someone"

    # Collect all person IDs involved (participants + paid_by), excluding self
    involved_person_ids = set()
    participants = db.query(ExpenseParticipant).filter(
        ExpenseParticipant.expense_id == expense.id
    ).all()
    for p in participants:
        involved_person_ids.add(p.person_id)
    involved_person_ids.add(expense.paid_by_id)
    involved_person_ids.discard(self_person.id)

    if not involved_person_ids:
        return

    # Build message
    if action == "created":
        message = f"{self_person.name} added \"{expense.title}\" (${expense.amount:.2f}) paid by {paid_by_name}"
        ntype = "expense_created"
    elif action == "updated":
        message = f"{self_person.name} updated \"{expense.title}\" (${expense.amount:.2f})"
        ntype = "expense_updated"
    else:
        message = f"{self_person.name} involved you in \"{expense.title}\" (${expense.amount:.2f})"
        ntype = "expense_split"

    # For each involved person, find their user_id (if they are a "self" person with a user account)
    # In the current model, all people belong to the same user, so we notify the expense owner.
    # But for the notification to make sense in a multi-user future, we notify the expense owner
    # about involvement of others.
    # For now: create one notification per involved person, all for the same user.
    for person_id in involved_person_ids:
        person = db.query(User).filter(User.id == person_id).first()
        if not person:
            continue
        db.add(Notification(
            user_id=expense.user_id,
            message=message,
            type=ntype,
            expense_id=expense.id,
        ))

    db.commit()
