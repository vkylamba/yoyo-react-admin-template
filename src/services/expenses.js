import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- People ---
export const getPeople = () => api.get('/people').then((r) => r.data);
export const createPerson = (data) => api.post('/people', data).then((r) => r.data);
export const updatePerson = (id, data) => api.put(`/people/${id}`, data).then((r) => r.data);
export const deletePerson = (id) => api.delete(`/people/${id}`).then((r) => r.data);

// --- Expenses ---
export const getExpenses = (params) => api.get('/expenses', { params }).then((r) => r.data);
export const getExpense = (id) => api.get(`/expenses/${id}`).then((r) => r.data);
export const createExpense = (data) => api.post('/expenses', data).then((r) => r.data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data).then((r) => r.data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`).then((r) => r.data);

export const uploadAttachment = (expenseId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/expenses/${expenseId}/attachment`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then((r) => r.data);
};
export const deleteAttachment = (expenseId) => api.delete(`/expenses/${expenseId}/attachment`).then((r) => r.data);

// --- Recurring Rules ---
export const getRecurringRules = () => api.get('/recurring').then((r) => r.data);
export const getRecurringRule = (id) => api.get(`/recurring/${id}`).then((r) => r.data);
export const createRecurringRule = (data) => api.post('/recurring', data).then((r) => r.data);
export const updateRecurringRule = (id, data) => api.put(`/recurring/${id}`, data).then((r) => r.data);
export const deleteRecurringRule = (id) => api.delete(`/recurring/${id}`).then((r) => r.data);
export const triggerRecurringRule = (id, payload = null) => {
  if (typeof payload === 'string') {
    return api.post(`/recurring/${id}/trigger`, null, { params: { date: payload } }).then((r) => r.data);
  }

  const params = payload?.start_date && payload?.end_date
    ? {
      ...payload,
      tag_ids: Array.isArray(payload.tag_ids) && payload.tag_ids.length > 0 ? payload.tag_ids.join(',') : undefined
    }
    : {};
  return api.post(`/recurring/${id}/trigger`, null, { params }).then((r) => r.data);
};

// --- My Expenses ---
export const getMyExpenses = (params) => api.get('/expenses/my', { params }).then((r) => r.data);
export const getMyDashboard = (params) => api.get('/dashboard/my-expenses', { params }).then((r) => r.data);

// --- Dashboard ---
export const getExpenseDashboard = (params) => api.get('/dashboard/expenses', { params }).then((r) => r.data);

// --- Reports ---
export const getMonthlyReport = (month, year) => api.get('/reports/monthly', { params: { month, year } }).then((r) => r.data);
export const getReportSubscription = () => api.get('/reports/subscription').then((r) => r.data);
export const upsertReportSubscription = (data) => api.post('/reports/subscription', data).then((r) => r.data);
export const testReportSubscriptionEmail = (month, year) =>
  api.post('/reports/subscription/test', null, { params: { month, year } }).then((r) => r.data);
export const sendReportSubscriptionTestEmail = (month, year) =>
  api.post('/reports/subscription/test-send', null, { params: { month, year } }).then((r) => r.data);

// --- Tags ---
export const getTags = () => api.get('/tags').then((r) => r.data);
export const createTag = (data) => api.post('/tags', data).then((r) => r.data);
export const updateTag = (id, data) => api.put(`/tags/${id}`, data).then((r) => r.data);
export const deleteTag = (id) => api.delete(`/tags/${id}`).then((r) => r.data);

// --- Trips ---
export const getTrips = () => api.get('/trips').then((r) => r.data);
export const getTrip = (id) => api.get(`/trips/${id}`).then((r) => r.data);
export const createTrip = (data) => api.post('/trips', data).then((r) => r.data);
export const updateTrip = (id, data) => api.put(`/trips/${id}`, data).then((r) => r.data);
export const deleteTrip = (id) => api.delete(`/trips/${id}`).then((r) => r.data);
export const addExpensesToTrip = (tripId, expenseIds) => api.post(`/trips/${tripId}/expenses`, { expense_ids: expenseIds }).then((r) => r.data);
export const removeExpenseFromTrip = (tripId, expenseId) => api.delete(`/trips/${tripId}/expenses/${expenseId}`).then((r) => r.data);
export const getTripDashboard = (tripId) => api.get(`/trips/${tripId}/dashboard`).then((r) => r.data);

// --- Notifications ---
export const getNotifications = (limit = 20) => api.get('/notifications', { params: { limit } }).then((r) => r.data);
export const markAllNotificationsRead = () => api.post('/notifications/read-all').then((r) => r.data);
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read`).then((r) => r.data);

// --- Constants ---
export const EXPENSE_CATEGORIES = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'travel', label: 'Travel' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'dining', label: 'Dining' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' }
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' }
];

export const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];
