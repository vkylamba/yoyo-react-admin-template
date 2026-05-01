import ExpenseForm from './ExpenseForm';
import { createExpense, uploadAttachment } from 'services/expenses';

export default function AddExpense() {
  const handleSubmit = async (values, file) => {
    const expense = await createExpense({
      title: values.title,
      amount: parseFloat(values.amount),
      category: values.category,
      payment_method: values.payment_method,
      paid_by_id: values.paid_by_id,
      participant_ids: values.participant_ids,
      tag_ids: values.tag_ids,
      trip_id: values.trip_id || null,
      consider_for_split: values.consider_for_split,
      is_private: values.is_private,
      expense_date: values.expense_date,
      notes: values.notes || null
    });
    if (file) {
      await uploadAttachment(expense.id, file);
    }
  };

  return <ExpenseForm onSubmit={handleSubmit} />;
}
