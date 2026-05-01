"""
Sample data loader for the expense tracker.
Run: cd server && .venv/bin/python seed_data.py
"""
import json
import random
from datetime import datetime, timedelta, timezone

from database import Base, SessionLocal, engine
from models import Expense, ExpenseParticipant, ExpenseTag, RecurringRule, ReportSubscription, Tag, Trip, User
from utils.security import hash_password
from utils.seeding import ADMIN_EMAIL, ensure_admin_user

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ---------------------------------------------------------------------------
# 1. Ensure admin user exists
# ---------------------------------------------------------------------------
user, created = ensure_admin_user(db)
if created:
    print("Created admin user")
else:
    print(f"Admin user exists (id={user.id})")

# ---------------------------------------------------------------------------
# 2. People (stored in merged users table)
# ---------------------------------------------------------------------------
existing_people = db.query(User).filter(User.owner_user_id == user.id).count()
if existing_people > 0:
    print(f"People already seeded ({existing_people}). Skipping.")
    people = db.query(User).filter(User.owner_user_id == user.id).all()
else:
    people_data = [
        {"firstname": "Sarah", "lastname": "Johnson", "email": "sarah@example.com"},
        {"firstname": "Mike", "lastname": "Chen", "email": "mike@example.com"},
        {"firstname": "Priya", "lastname": "Patel", "email": "priya@example.com"},
    ]
    people = []
    for p in people_data:
        person = User(
            owner_user_id=user.id,
            firstname=p["firstname"],
            lastname=p["lastname"],
            email=f"{p['firstname'].lower()}.{p['lastname'].lower()}.{user.id}@local.invalid",
            password_hash=hash_password("__NO_LOGIN__"),
            company=user.company,
            is_active=True,
            is_self=False,
            can_login=False,
            is_admin=False,
            is_superuser=False,
        )
        db.add(person)
        db.flush()
        people.append(person)
    db.commit()
    print(f"Created {len(people)} people")

person_ids = [user.id] + [p.id for p in people]
self_id = user.id
now = datetime.now(timezone.utc)

# ---------------------------------------------------------------------------
# 3. Sample expenses (last 90 days)
# ---------------------------------------------------------------------------
existing_expenses = db.query(Expense).filter(Expense.user_id == user.id).count()
if existing_expenses > 0:
    print(f"Expenses already seeded ({existing_expenses}). Skipping.")
else:
    expense_templates = [
        # Groceries
        {"title": "Weekly groceries - Whole Foods", "amount": 87.50, "category": "groceries", "payment_method": "credit_card"},
        {"title": "Vegetables & fruits", "amount": 32.40, "category": "groceries", "payment_method": "debit_card"},
        {"title": "Costco bulk shopping", "amount": 156.80, "category": "groceries", "payment_method": "credit_card"},
        {"title": "Milk, bread, eggs", "amount": 18.95, "category": "groceries", "payment_method": "cash"},
        {"title": "Trader Joe's run", "amount": 64.20, "category": "groceries", "payment_method": "debit_card"},
        # Dining
        {"title": "Dinner at Thai Palace", "amount": 68.50, "category": "dining", "payment_method": "credit_card"},
        {"title": "Coffee & pastries", "amount": 12.75, "category": "dining", "payment_method": "upi"},
        {"title": "Pizza night", "amount": 42.00, "category": "dining", "payment_method": "cash"},
        {"title": "Lunch with team", "amount": 35.80, "category": "dining", "payment_method": "credit_card"},
        {"title": "Brunch at Cafe Luna", "amount": 54.30, "category": "dining", "payment_method": "debit_card"},
        # Travel
        {"title": "Uber to airport", "amount": 45.00, "category": "travel", "payment_method": "upi"},
        {"title": "Gas station fill-up", "amount": 52.30, "category": "travel", "payment_method": "debit_card"},
        {"title": "Monthly transit pass", "amount": 85.00, "category": "travel", "payment_method": "bank_transfer"},
        {"title": "Parking downtown", "amount": 15.00, "category": "travel", "payment_method": "cash"},
        {"title": "Train tickets", "amount": 38.50, "category": "travel", "payment_method": "credit_card"},
        # Rent
        {"title": "Monthly rent - April", "amount": 1800.00, "category": "rent", "payment_method": "bank_transfer"},
        {"title": "Monthly rent - March", "amount": 1800.00, "category": "rent", "payment_method": "bank_transfer"},
        {"title": "Monthly rent - February", "amount": 1800.00, "category": "rent", "payment_method": "bank_transfer"},
        # Utilities
        {"title": "Electric bill", "amount": 125.40, "category": "utilities", "payment_method": "bank_transfer"},
        {"title": "Internet service", "amount": 59.99, "category": "utilities", "payment_method": "credit_card"},
        {"title": "Water bill", "amount": 45.80, "category": "utilities", "payment_method": "bank_transfer"},
        {"title": "Phone plan", "amount": 55.00, "category": "utilities", "payment_method": "credit_card"},
        {"title": "Gas bill", "amount": 78.30, "category": "utilities", "payment_method": "bank_transfer"},
        # Entertainment
        {"title": "Netflix subscription", "amount": 15.99, "category": "entertainment", "payment_method": "credit_card"},
        {"title": "Movie tickets", "amount": 28.00, "category": "entertainment", "payment_method": "upi"},
        {"title": "Spotify premium", "amount": 9.99, "category": "entertainment", "payment_method": "credit_card"},
        {"title": "Concert tickets", "amount": 120.00, "category": "entertainment", "payment_method": "credit_card"},
        {"title": "Board game night supplies", "amount": 35.50, "category": "entertainment", "payment_method": "cash"},
        # Healthcare
        {"title": "Doctor visit copay", "amount": 40.00, "category": "healthcare", "payment_method": "debit_card"},
        {"title": "Pharmacy - prescriptions", "amount": 25.60, "category": "healthcare", "payment_method": "credit_card"},
        {"title": "Gym membership", "amount": 49.99, "category": "healthcare", "payment_method": "bank_transfer"},
        {"title": "Dental cleaning", "amount": 75.00, "category": "healthcare", "payment_method": "credit_card"},
        # Education
        {"title": "Udemy course - Python", "amount": 14.99, "category": "education", "payment_method": "credit_card"},
        {"title": "Books from Amazon", "amount": 42.80, "category": "education", "payment_method": "credit_card"},
        {"title": "Online workshop fee", "amount": 99.00, "category": "education", "payment_method": "upi"},
        # Other
        {"title": "Dry cleaning", "amount": 28.50, "category": "other", "payment_method": "cash"},
        {"title": "Birthday gift for Sarah", "amount": 65.00, "category": "other", "payment_method": "credit_card"},
        {"title": "Haircut", "amount": 35.00, "category": "other", "payment_method": "cash"},
        {"title": "Home cleaning supplies", "amount": 22.40, "category": "other", "payment_method": "debit_card"},
        {"title": "Donation - local charity", "amount": 50.00, "category": "other", "payment_method": "bank_transfer"},
    ]

    count = 0
    for tmpl in expense_templates:
        days_ago = random.randint(0, 89)
        hour = random.randint(7, 21)
        minute = random.randint(0, 59)
        expense_date = now - timedelta(days=days_ago, hours=random.randint(0, 12))
        expense_date = expense_date.replace(hour=hour, minute=minute)

        # Vary amounts slightly
        amount = round(tmpl["amount"] * random.uniform(0.9, 1.1), 2)

        # Randomly assign who paid
        paid_by = random.choice(person_ids)

        # Decide split
        consider_split = tmpl["category"] in ("groceries", "dining", "rent", "utilities", "entertainment")
        if consider_split:
            num_participants = random.randint(2, len(person_ids))
            participants = random.sample(person_ids, num_participants)
            if paid_by not in participants:
                participants[0] = paid_by
        else:
            participants = [paid_by]

        expense = Expense(
            user_id=user.id,
            title=tmpl["title"],
            amount=amount,
            category=tmpl["category"],
            payment_method=tmpl["payment_method"],
            paid_by_id=paid_by,
            consider_for_split=consider_split,
            expense_date=expense_date,
            notes=None,
        )
        db.add(expense)
        db.flush()

        for pid in participants:
            db.add(ExpenseParticipant(expense_id=expense.id, person_id=pid))

        count += 1

    db.commit()
    print(f"Created {count} expenses over the last 90 days")

# ---------------------------------------------------------------------------
# 4. Recurring rules
# ---------------------------------------------------------------------------
existing_rules = db.query(RecurringRule).filter(RecurringRule.user_id == user.id).count()
if existing_rules > 0:
    print(f"Recurring rules already seeded ({existing_rules}). Skipping.")
else:
    rules = [
        {
            "title": "Monthly Rent",
            "amount": 1800.00,
            "category": "rent",
            "payment_method": "bank_transfer",
            "paid_by_id": self_id,
            "frequency": "monthly",
            "consider_for_split": True,
            "participant_ids_json": json.dumps(person_ids[:2]),
            "start_date": now - timedelta(days=60),
        },
        {
            "title": "Netflix Subscription",
            "amount": 15.99,
            "category": "entertainment",
            "payment_method": "credit_card",
            "paid_by_id": self_id,
            "frequency": "monthly",
            "consider_for_split": True,
            "participant_ids_json": json.dumps(person_ids),
            "start_date": now - timedelta(days=30),
        },
        {
            "title": "Internet Bill",
            "amount": 59.99,
            "category": "utilities",
            "payment_method": "credit_card",
            "paid_by_id": self_id,
            "frequency": "monthly",
            "consider_for_split": True,
            "participant_ids_json": json.dumps(person_ids[:2]),
            "start_date": now - timedelta(days=15),
        },
        {
            "title": "Gym Membership",
            "amount": 49.99,
            "category": "healthcare",
            "payment_method": "bank_transfer",
            "paid_by_id": self_id,
            "frequency": "monthly",
            "consider_for_split": False,
            "participant_ids_json": json.dumps([self_id]),
            "start_date": now - timedelta(days=45),
        },
        {
            "title": "Weekly Groceries",
            "amount": 85.00,
            "category": "groceries",
            "payment_method": "debit_card",
            "paid_by_id": self_id,
            "frequency": "weekly",
            "consider_for_split": True,
            "participant_ids_json": json.dumps(person_ids[:3]),
            "start_date": now - timedelta(days=7),
        },
    ]

    for r in rules:
        db.add(RecurringRule(user_id=user.id, is_active=True, **r))

    db.commit()
    print(f"Created {len(rules)} recurring rules")

# ---------------------------------------------------------------------------
# 5. Report subscription
# ---------------------------------------------------------------------------
sub = db.query(ReportSubscription).filter(ReportSubscription.user_id == user.id).first()
if not sub:
    db.add(ReportSubscription(
        user_id=user.id,
        is_active=True,
        email=ADMIN_EMAIL,
        day_of_month=1,
    ))
    db.commit()
    print("Created report subscription")
else:
    print("Report subscription already exists")

# ---------------------------------------------------------------------------
# 6. Tags
# ---------------------------------------------------------------------------
existing_tags = db.query(Tag).filter(Tag.user_id == user.id).count()
if existing_tags > 0:
    print(f"Tags already seeded ({existing_tags}). Skipping.")
else:
    tag_data = [
        {"name": "vacation", "color": "#1890ff"},
        {"name": "business", "color": "#52c41a"},
        {"name": "shared", "color": "#faad14"},
        {"name": "personal", "color": "#f5222d"},
        {"name": "reimbursable", "color": "#722ed1"},
        {"name": "essential", "color": "#13c2c2"},
    ]
    tag_objects = []
    for t in tag_data:
        tag = Tag(user_id=user.id, **t)
        db.add(tag)
        db.flush()
        tag_objects.append(tag)
    db.commit()
    print(f"Created {len(tag_objects)} tags")

    # Tag some existing expenses
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    tag_ids = [t.id for t in tag_objects]
    for exp in expenses:
        # Randomly assign 0-2 tags
        num_tags = random.randint(0, 2)
        if num_tags > 0:
            chosen = random.sample(tag_ids, min(num_tags, len(tag_ids)))
            for tid in chosen:
                db.add(ExpenseTag(expense_id=exp.id, tag_id=tid))
    db.commit()
    print(f"Tagged expenses with random tags")

# ---------------------------------------------------------------------------
# 7. Trips
# ---------------------------------------------------------------------------
existing_trips = db.query(Trip).filter(Trip.user_id == user.id).count()
if existing_trips > 0:
    print(f"Trips already seeded ({existing_trips}). Skipping.")
else:
    trip = Trip(
        user_id=user.id,
        name="Goa Beach Trip",
        description="Annual beach vacation with friends",
        start_date=now - timedelta(days=20),
        end_date=now - timedelta(days=14),
    )
    db.add(trip)
    db.flush()

    trip2 = Trip(
        user_id=user.id,
        name="Business Conference",
        description="Tech conference in Bangalore",
        start_date=now - timedelta(days=45),
        end_date=now - timedelta(days=42),
    )
    db.add(trip2)
    db.flush()

    # Assign some expenses to trips
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    travel_dining = [e for e in expenses if e.category in ("travel", "dining", "entertainment")]
    for i, exp in enumerate(travel_dining[:5]):
        exp.trip_id = trip.id
    for i, exp in enumerate(travel_dining[5:8]):
        exp.trip_id = trip2.id
    db.commit()
    print(f"Created 2 trips and assigned expenses")

db.close()
print("\nSeed complete!")
