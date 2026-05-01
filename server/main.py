import os
import secrets
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from wtforms import PasswordField

load_dotenv()

from fastapi.staticfiles import StaticFiles

from config import CORS_ORIGINS
from database import Base, SessionLocal, engine
from models import (
    Expense, ExpenseParticipant, ExpenseTag, Notification,
    RecurringRule, ReportSubscription, Tag, Trip, User,
)
from routes.auth import router as auth_router
from routes.dashboard import router as dashboard_router
from routes.expenses import router as expenses_router
from routes.people import router as people_router
from routes.recurring import router as recurring_router
from routes.reports import router as reports_router
from routes.notifications import router as notifications_router
from routes.tags import router as tags_router
from routes.trips import router as trips_router
from utils.migrations import migrate_merge_users_people
from utils.security import hash_password, verify_password
from utils.seeding import ADMIN_EMAIL

migrate_merge_users_people(engine)
Base.metadata.create_all(bind=engine)


def process_recurring_startup():
    from database import SessionLocal
    from utils.recurring import process_recurring_rules
    db = SessionLocal()
    try:
        count = process_recurring_rules(db)
        if count:
            print(f"Generated {count} expense(s) from recurring rules")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    process_recurring_startup()
    yield


app = FastAPI(title="Mantis Admin API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api"
app.include_router(auth_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(people_router, prefix=api_prefix)
app.include_router(expenses_router, prefix=api_prefix)
app.include_router(recurring_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)
app.include_router(tags_router, prefix=api_prefix)
app.include_router(trips_router, prefix=api_prefix)

# Serve uploaded files
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=uploads_dir), name="uploads")


class UserAdmin(ModelView, model=User):
    column_list = [
        User.id,
        User.owner_user_id,
        User.email,
        User.firstname,
        User.lastname,
        User.company,
        User.can_login,
        User.is_admin,
        User.is_superuser,
        User.is_active,
        User.created_at,
    ]
    column_searchable_list = [User.email, User.firstname, User.lastname]
    column_sortable_list = [User.id, User.email, User.created_at]
    form_excluded_columns = [User.created_at]
    form_overrides = {"password_hash": PasswordField}
    form_args = {
        "password_hash": {"label": "Password"}
    }

    async def on_model_change(self, data, model, is_created, request):
        raw_password = data.get("password_hash")
        new_password = raw_password.strip() if isinstance(raw_password, str) else ""

        if is_created and not new_password:
            raise ValueError("Password is required when creating a user")

        if new_password:
            data["password_hash"] = hash_password(new_password)
            return

        # On edit, empty password means keep the current hash unchanged.
        if not is_created and model.id:
            db = SessionLocal()
            try:
                existing = db.query(User).filter(User.id == model.id).first()
                if existing:
                    data["password_hash"] = existing.password_hash
            finally:
                db.close()


class PersonAdmin(ModelView, model=User):
    column_list = [User.id, User.owner_user_id, User.firstname, User.lastname, User.email, User.is_self, User.can_login]
    column_searchable_list = [User.firstname, User.lastname, User.email]


class ExpenseAdmin(ModelView, model=Expense):
    column_list = [Expense.id, Expense.title, Expense.amount, Expense.category, Expense.payment_method, Expense.expense_date]
    column_searchable_list = [Expense.title]
    column_sortable_list = [Expense.id, Expense.amount, Expense.expense_date]
    form_columns = [
        Expense.user_id,
        Expense.title,
        Expense.amount,
        Expense.category,
        Expense.payment_method,
        Expense.paid_by_id,
        Expense.consider_for_split,
        Expense.is_private,
        Expense.expense_date,
        Expense.notes,
        Expense.attachment_filename,
        Expense.recurring_rule_id,
        Expense.trip_id,
    ]


class ExpenseParticipantAdmin(ModelView, model=ExpenseParticipant):
    column_list = [ExpenseParticipant.id, ExpenseParticipant.expense_id, ExpenseParticipant.person_id]
    column_sortable_list = [ExpenseParticipant.id, ExpenseParticipant.expense_id, ExpenseParticipant.person_id]


class RecurringRuleAdmin(ModelView, model=RecurringRule):
    column_list = [RecurringRule.id, RecurringRule.title, RecurringRule.amount, RecurringRule.frequency, RecurringRule.is_active]


class ReportSubscriptionAdmin(ModelView, model=ReportSubscription):
    column_list = [ReportSubscription.id, ReportSubscription.user_id, ReportSubscription.email, ReportSubscription.is_active]


class TagAdmin(ModelView, model=Tag):
    column_list = [Tag.id, Tag.user_id, Tag.name, Tag.color]
    column_searchable_list = [Tag.name]


class TripAdmin(ModelView, model=Trip):
    column_list = [Trip.id, Trip.user_id, Trip.name, Trip.start_date, Trip.end_date]
    column_searchable_list = [Trip.name]


ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin")


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        raw_username = form.get("username")
        raw_password = form.get("password")
        username = raw_username.strip() if isinstance(raw_username, str) else ""
        password = raw_password if isinstance(raw_password, str) else ""

        # Keep support for static admin credentials via env vars.
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            request.session.update({"authenticated": True})
            return True

        # Also allow SQLAdmin login using seeded application user credentials.
        login_email = ADMIN_EMAIL if username == "admin" else username
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == login_email).first()
            if user and user.password_hash and verify_password(password, user.password_hash):
                request.session.update({"authenticated": True})
                return True
        finally:
            db.close()

        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return request.session.get("authenticated", False)


admin = Admin(
    app,
    engine,
    title="Mantis Admin",
    authentication_backend=AdminAuth(secret_key=secrets.token_hex(32)),
)
admin.add_view(UserAdmin)
admin.add_view(PersonAdmin)
admin.add_view(ExpenseAdmin)
admin.add_view(ExpenseParticipantAdmin)
admin.add_view(RecurringRuleAdmin)
admin.add_view(ReportSubscriptionAdmin)
admin.add_view(TagAdmin)
admin.add_view(TripAdmin)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    ui_index = os.path.join(os.path.dirname(__file__), "assets", "index.html")
    if os.path.isfile(ui_index):
        from fastapi.responses import FileResponse

        return FileResponse(ui_index)

    return {
        "message": "Mantis Admin API is running",
        "health": "/health",
        "admin": "/admin",
        "api": "/api",
    }


# ---------------------------------------------------------------------------
# Serve the built React UI from server/assets/
# Must be registered LAST so API routes take priority.
# ---------------------------------------------------------------------------
ui_dir = os.path.join(os.path.dirname(__file__), "assets")
if os.path.isdir(ui_dir):
    from fastapi.responses import FileResponse

    # Serve /assets/* directly as static files
    built_assets_dir = os.path.join(ui_dir, "assets")
    if os.path.isdir(built_assets_dir):
        app.mount("/assets", StaticFiles(directory=built_assets_dir), name="ui-assets")

    # Catch-all: serve files if they exist, otherwise index.html for SPA routing
    @app.api_route("/{full_path:path}", methods=["GET"], include_in_schema=False)
    def serve_spa(full_path: str):
        file_path = os.path.join(ui_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(ui_dir, "index.html"))


if __name__ == "__main__":
    app_dir = os.path.dirname(__file__)
    uvicorn.run("main:app", host="0.0.0.0", port=8085, reload=True, app_dir=app_dir, reload_dirs=[app_dir])
