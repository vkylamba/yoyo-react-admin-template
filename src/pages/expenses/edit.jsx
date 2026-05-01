import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Typography from '@mui/material/Typography';

import ExpenseForm from './ExpenseForm';
import { getExpense, updateExpense, uploadAttachment } from 'services/expenses';

export default function EditExpense() {
  const { id } = useParams();
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    getExpense(id).then((expense) => {
      setInitialValues({
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        payment_method: expense.payment_method,
        paid_by_id: expense.paid_by_id,
        participant_ids: expense.participants.map((p) => p.person_id),
        tag_ids: (expense.tags || []).map((t) => t.id),
        trip_id: expense.trip_id || '',
        consider_for_split: expense.consider_for_split,
        is_private: expense.is_private || false,
        expense_date: expense.expense_date.slice(0, 16),
        notes: expense.notes || '',
        attachment_filename: expense.attachment_filename
      });
    });
  }, [id]);

  const handleSubmit = async (values, file) => {
    await updateExpense(id, {
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
      await uploadAttachment(id, file);
    }
  };

  if (!initialValues) return <Typography>Loading...</Typography>;

  return <ExpenseForm initialValues={initialValues} onSubmit={handleSubmit} isEdit />;
}
