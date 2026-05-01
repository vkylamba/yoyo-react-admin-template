from typing import List, Optional

from pydantic import BaseModel, EmailStr


# --- Auth ---

class LoginRequest(BaseModel):
    username: str  # frontend sends email as "username"
    password: str


class RegisterRequest(BaseModel):
    firstname: str
    lastname: str
    email: EmailStr
    password: str
    company: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class TokenResponse(BaseModel):
    token: str


class MessageResponse(BaseModel):
    message: str


class UserOut(BaseModel):
    id: int
    email: str
    firstname: str
    lastname: str
    company: Optional[str]

    model_config = {"from_attributes": True}


class VerifyResponse(BaseModel):
    valid: bool
    user: UserOut


# --- Dashboard ---

class StatCard(BaseModel):
    title: str
    count: str
    percentage: float
    isLoss: bool = False
    color: str = "primary"
    extra: str


class DashboardStats(BaseModel):
    cards: List[StatCard]


class Order(BaseModel):
    tracking_no: int
    name: str
    fat: float
    carbs: float
    protein: float


class AnalyticsItem(BaseModel):
    label: str
    value: str


class IncomeOverview(BaseModel):
    weekly_income: str
    monthly_data: List[int]


class DashboardData(BaseModel):
    stats: DashboardStats
    recent_orders: List[Order]
    analytics: List[AnalyticsItem]
    income: IncomeOverview


# --- Constants ---

EXPENSE_CATEGORIES = [
    "groceries", "travel", "rent", "utilities", "entertainment",
    "dining", "healthcare", "education", "other",
]

PAYMENT_METHODS = [
    "cash", "credit_card", "debit_card", "upi", "bank_transfer", "other",
]

FREQUENCIES = ["daily", "weekly", "monthly", "yearly"]


# --- Person ---

class PersonCreate(BaseModel):
    name: str
    email: Optional[str] = None


class PersonOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    is_self: bool

    model_config = {"from_attributes": True}


# --- Tag ---

class TagCreate(BaseModel):
    name: str
    color: Optional[str] = None


class TagOut(BaseModel):
    id: int
    name: str
    color: Optional[str]

    model_config = {"from_attributes": True}


# --- Trip ---

class TripCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class TripUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class TripOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    expense_count: int
    total_amount: float
    created_at: str


class TripExpensesRequest(BaseModel):
    expense_ids: List[int]


# --- Expense ---

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    participant_ids: List[int] = []
    tag_ids: List[int] = []
    trip_id: Optional[int] = None
    consider_for_split: bool = True
    is_private: bool = False
    expense_date: str
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    paid_by_id: Optional[int] = None
    participant_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None
    trip_id: Optional[int] = None
    consider_for_split: Optional[bool] = None
    is_private: Optional[bool] = None
    expense_date: Optional[str] = None
    notes: Optional[str] = None


class ParticipantOut(BaseModel):
    id: int
    person_id: int
    person_name: str


class ExpenseOut(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    paid_by_name: str
    consider_for_split: bool
    is_private: bool
    attachment_filename: Optional[str]
    attachment_url: Optional[str]
    expense_date: str
    notes: Optional[str]
    participants: List[ParticipantOut]
    tags: List[TagOut]
    trip_id: Optional[int]
    trip_name: Optional[str]
    recurring_rule_id: Optional[int]
    created_at: str


class ExpenseListResponse(BaseModel):
    items: List[ExpenseOut]
    total: int
    page: int
    page_size: int


# --- Recurring Rule ---

class RecurringRuleCreate(BaseModel):
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    participant_ids: List[int] = []
    consider_for_split: bool = True
    notes: Optional[str] = None
    frequency: str
    start_date: str
    end_date: Optional[str] = None


class RecurringRuleUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    paid_by_id: Optional[int] = None
    participant_ids: Optional[List[int]] = None
    consider_for_split: Optional[bool] = None
    notes: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = None


class RecurringRuleOut(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    paid_by_name: str
    participant_ids: List[int]
    consider_for_split: bool
    notes: Optional[str]
    frequency: str
    start_date: str
    end_date: Optional[str]
    is_active: bool
    last_generated_date: Optional[str]
    created_at: str


# --- Report Subscription ---

# --- Notification ---

class NotificationOut(BaseModel):
    id: int
    message: str
    type: str
    expense_id: Optional[int]
    is_read: bool
    created_at: str

    model_config = {"from_attributes": True}


class NotificationCountOut(BaseModel):
    unread_count: int
    notifications: List[NotificationOut]


class ReportSubscriptionUpsert(BaseModel):
    is_active: bool = False
    email: str
    day_of_month: int = 1


class ReportSubscriptionOut(BaseModel):
    id: int
    is_active: bool
    email: str
    day_of_month: int

    model_config = {"from_attributes": True}


class ReportEmailPreviewOut(BaseModel):
    to_email: str
    subject: str
    body: str
    month: int
    year: int


# --- Dashboard Analytics ---

class CategoryBreakdown(BaseModel):
    category: str
    total: float
    count: int


class PaymentMethodBreakdown(BaseModel):
    method: str
    total: float
    count: int


class TimeSeriesPoint(BaseModel):
    date: str
    total: float


class CategoryTimeSeriesPoint(BaseModel):
    date: str
    categories: dict  # {category_name: amount}


class PaidByBreakdown(BaseModel):
    person_id: int
    person_name: str
    total: float
    count: int


class SplitSummary(BaseModel):
    person_id: int
    person_name: str
    total_paid: float
    total_share: float
    net_balance: float


class ExpenseDashboardData(BaseModel):
    total_expenses: float
    expense_count: int
    category_breakdown: List[CategoryBreakdown]
    payment_method_breakdown: List[PaymentMethodBreakdown]
    paid_by_breakdown: List[PaidByBreakdown]
    expenses_over_time: List[TimeSeriesPoint]
    category_over_time: List[CategoryTimeSeriesPoint]
    split_summary: List[SplitSummary]


class MonthlyReportData(BaseModel):
    month: int
    year: int
    total_expenses: float
    category_breakdown: List[CategoryBreakdown]
    payment_method_breakdown: List[PaymentMethodBreakdown]
    person_breakdown: List[SplitSummary]


# --- Constants ---

EXPENSE_CATEGORIES = [
    "groceries", "travel", "rent", "utilities", "entertainment",
    "dining", "healthcare", "education", "other",
]

PAYMENT_METHODS = [
    "cash", "credit_card", "debit_card", "upi", "bank_transfer", "other",
]

FREQUENCIES = ["daily", "weekly", "monthly", "yearly"]


# --- Person ---

class PersonCreate(BaseModel):
    name: str
    email: Optional[str] = None


class PersonOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    is_self: bool

    model_config = {"from_attributes": True}


# --- Tag ---

class TagCreate(BaseModel):
    name: str
    color: Optional[str] = None


class TagOut(BaseModel):
    id: int
    name: str
    color: Optional[str]

    model_config = {"from_attributes": True}


# --- Trip ---

class TripCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class TripUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class TripOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    expense_count: int
    total_amount: float
    created_at: str


class TripExpensesRequest(BaseModel):
    expense_ids: List[int]


# --- Expense ---

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    participant_ids: List[int] = []
    tag_ids: List[int] = []
    trip_id: Optional[int] = None
    consider_for_split: bool = True
    is_private: bool = False
    expense_date: str
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    paid_by_id: Optional[int] = None
    participant_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None
    trip_id: Optional[int] = None
    consider_for_split: Optional[bool] = None
    is_private: Optional[bool] = None
    expense_date: Optional[str] = None
    notes: Optional[str] = None


class ParticipantOut(BaseModel):
    id: int
    person_id: int
    person_name: str


class ExpenseOut(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    paid_by_name: str
    consider_for_split: bool
    is_private: bool
    attachment_filename: Optional[str]
    attachment_url: Optional[str]
    expense_date: str
    notes: Optional[str]
    participants: List[ParticipantOut]
    tags: List[TagOut]
    trip_id: Optional[int]
    trip_name: Optional[str]
    recurring_rule_id: Optional[int]
    created_at: str


class ExpenseListResponse(BaseModel):
    items: List[ExpenseOut]
    total: int
    page: int
    page_size: int


# --- Recurring Rule ---

class RecurringRuleCreate(BaseModel):
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    participant_ids: List[int] = []
    consider_for_split: bool = True
    notes: Optional[str] = None
    frequency: str
    start_date: str
    end_date: Optional[str] = None


class RecurringRuleUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    paid_by_id: Optional[int] = None
    participant_ids: Optional[List[int]] = None
    consider_for_split: Optional[bool] = None
    notes: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = None


class RecurringRuleOut(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    paid_by_name: str
    participant_ids: List[int]
    consider_for_split: bool
    notes: Optional[str]
    frequency: str
    start_date: str
    end_date: Optional[str]
    is_active: bool
    last_generated_date: Optional[str]
    created_at: str


# --- Report Subscription ---

# --- Notification ---

class NotificationOut(BaseModel):
    id: int
    message: str
    type: str
    expense_id: Optional[int]
    is_read: bool
    created_at: str

    model_config = {"from_attributes": True}


class NotificationCountOut(BaseModel):
    unread_count: int
    notifications: List[NotificationOut]


class ReportSubscriptionUpsert(BaseModel):
    is_active: bool = False
    email: str
    day_of_month: int = 1


class ReportSubscriptionOut(BaseModel):
    id: int
    is_active: bool
    email: str
    day_of_month: int

    model_config = {"from_attributes": True}


# --- Dashboard Analytics ---

class CategoryBreakdown(BaseModel):
    category: str
    total: float
    count: int


class PaymentMethodBreakdown(BaseModel):
    method: str
    total: float
    count: int


class TimeSeriesPoint(BaseModel):
    date: str
    total: float


class CategoryTimeSeriesPoint(BaseModel):
    date: str
    categories: dict  # {category_name: amount}


class PaidByBreakdown(BaseModel):
    person_id: int
    person_name: str
    total: float
    count: int


class SplitSummary(BaseModel):
    person_id: int
    person_name: str
    total_paid: float
    total_share: float
    net_balance: float


class ExpenseDashboardData(BaseModel):
    total_expenses: float
    expense_count: int
    category_breakdown: List[CategoryBreakdown]
    payment_method_breakdown: List[PaymentMethodBreakdown]
    paid_by_breakdown: List[PaidByBreakdown]
    expenses_over_time: List[TimeSeriesPoint]
    category_over_time: List[CategoryTimeSeriesPoint]
    split_summary: List[SplitSummary]


class MonthlyReportData(BaseModel):
    month: int
    year: int
    total_expenses: float
    category_breakdown: List[CategoryBreakdown]
    payment_method_breakdown: List[PaymentMethodBreakdown]
    person_breakdown: List[SplitSummary]


# --- Constants ---

EXPENSE_CATEGORIES = [
    "groceries", "travel", "rent", "utilities", "entertainment",
    "dining", "healthcare", "education", "other",
]

PAYMENT_METHODS = [
    "cash", "credit_card", "debit_card", "upi", "bank_transfer", "other",
]

FREQUENCIES = ["daily", "weekly", "monthly", "yearly"]


# --- Person ---

class PersonCreate(BaseModel):
    name: str
    email: Optional[str] = None


class PersonOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    is_self: bool

    model_config = {"from_attributes": True}


# --- Tag ---

class TagCreate(BaseModel):
    name: str
    color: Optional[str] = None


class TagOut(BaseModel):
    id: int
    name: str
    color: Optional[str]

    model_config = {"from_attributes": True}


# --- Trip ---

class TripCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class TripUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class TripOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    expense_count: int
    total_amount: float
    created_at: str


class TripExpensesRequest(BaseModel):
    expense_ids: List[int]


# --- Expense ---

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    participant_ids: List[int] = []
    tag_ids: List[int] = []
    trip_id: Optional[int] = None
    consider_for_split: bool = True
    is_private: bool = False
    expense_date: str
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    paid_by_id: Optional[int] = None
    participant_ids: Optional[List[int]] = None
    tag_ids: Optional[List[int]] = None
    trip_id: Optional[int] = None
    consider_for_split: Optional[bool] = None
    is_private: Optional[bool] = None
    expense_date: Optional[str] = None
    notes: Optional[str] = None


class ParticipantOut(BaseModel):
    id: int
    person_id: int
    person_name: str


class ExpenseOut(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    paid_by_name: str
    consider_for_split: bool
    is_private: bool
    attachment_filename: Optional[str]
    attachment_url: Optional[str]
    expense_date: str
    notes: Optional[str]
    participants: List[ParticipantOut]
    tags: List[TagOut]
    trip_id: Optional[int]
    trip_name: Optional[str]
    recurring_rule_id: Optional[int]
    created_at: str


class ExpenseListResponse(BaseModel):
    items: List[ExpenseOut]
    total: int
    page: int
    page_size: int


# --- Recurring Rule ---

class RecurringRuleCreate(BaseModel):
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    participant_ids: List[int] = []
    consider_for_split: bool = True
    notes: Optional[str] = None
    frequency: str
    start_date: str
    end_date: Optional[str] = None


class RecurringRuleUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    payment_method: Optional[str] = None
    paid_by_id: Optional[int] = None
    participant_ids: Optional[List[int]] = None
    consider_for_split: Optional[bool] = None
    notes: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = None


class RecurringRuleOut(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    payment_method: str
    paid_by_id: int
    paid_by_name: str
    participant_ids: List[int]
    consider_for_split: bool
    notes: Optional[str]
    frequency: str
    start_date: str
    end_date: Optional[str]
    is_active: bool
    last_generated_date: Optional[str]
    created_at: str


# --- Report Subscription ---

# --- Notification ---

class NotificationOut(BaseModel):
    id: int
    message: str
    type: str
    expense_id: Optional[int]
    is_read: bool
    created_at: str

    model_config = {"from_attributes": True}


class NotificationCountOut(BaseModel):
    unread_count: int
    notifications: List[NotificationOut]


class ReportSubscriptionUpsert(BaseModel):
    is_active: bool = False
    email: str
    day_of_month: int = 1


class ReportSubscriptionOut(BaseModel):
    id: int
    is_active: bool
    email: str
    day_of_month: int

    model_config = {"from_attributes": True}


# --- Dashboard Analytics ---

class CategoryBreakdown(BaseModel):
    category: str
    total: float
    count: int


class PaymentMethodBreakdown(BaseModel):
    method: str
    total: float
    count: int


class TimeSeriesPoint(BaseModel):
    date: str
    total: float


class CategoryTimeSeriesPoint(BaseModel):
    date: str
    categories: dict  # {category_name: amount}


class PaidByBreakdown(BaseModel):
    person_id: int
    person_name: str
    total: float
    count: int


class SplitSummary(BaseModel):
    person_id: int
    person_name: str
    total_paid: float
    total_share: float
    net_balance: float


class ExpenseDashboardData(BaseModel):
    total_expenses: float
    expense_count: int
    category_breakdown: List[CategoryBreakdown]
    payment_method_breakdown: List[PaymentMethodBreakdown]
    paid_by_breakdown: List[PaidByBreakdown]
    expenses_over_time: List[TimeSeriesPoint]
    category_over_time: List[CategoryTimeSeriesPoint]
    split_summary: List[SplitSummary]


class MonthlyReportData(BaseModel):
    month: int
    year: int
    total_expenses: float
    category_breakdown: List[CategoryBreakdown]
    payment_method_breakdown: List[PaymentMethodBreakdown]
    person_breakdown: List[SplitSummary]
