import e from 'express';
import { logUserAction } from '../middlewares/logHelper.js';
import {
  insertTransaction,
  getTransactionsByUser,
  updateTransactionData,
  deleteTransactionData,
  getAllTransactionsModel
} from '../models/transaction_model.js';
import { evaluateUserBudgetNotifications } from './notification_controller.js';
import { ensureCategoryByName } from '../models/categories_model.js';



// Add new transaction
export const addTransaction = async (req, res) => {
  try {
    const { amount, type, category_id, description, date } = req.body;
    const user_id = req.user?.id;
    if (!user_id || !amount || !type || !date) {
      return res.status(400).json({ error: 'user_id, amount, type, and date are required.' });
    }
    await logUserAction(req, 'ADD_TRANSACTION', `User ${user_id} added a ${type} transaction of amount ${amount} on ${date}`);
    const newTransaction = await insertTransaction(user_id, amount, type, category_id, description, date);
    // Evaluate budget notifications on expense entries
    try {
      if (type === 'expense') {
        await evaluateUserBudgetNotifications(user_id);
      }
    } catch (e) {
      console.warn('⚠️ Budget notification evaluation failed:', e.message);
    }
    return res.status(201).json(newTransaction);
  } catch (error) {
    console.error('❌ Error adding transaction:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all transactions for a user
export const getUserTransactions = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const transactions = await getTransactionsByUser(user_id);
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('❌ Error fetching transactions:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update transaction
export const updateTransaction = async (req, res) => {
  try {
    const transaction_id = req.params.transaction_id;
    const { amount, type, category_id, description, date } = req.body;
    const user_id = req.user?.id;
    const updatedTransaction = await updateTransactionData(transaction_id, amount, type, category_id, description, date);
    if (!updatedTransaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }
    await logUserAction(req, 'UPDATE_TRANSACTION', `User ${user_id} updated transaction ${transaction_id} to amount ${amount}, type ${type}, date ${date}`);
    // Re-evaluate budgets after update (if affects expenses)
    try {
      await evaluateUserBudgetNotifications(user_id);
    } catch (e) {
      console.warn('⚠️ Budget notification evaluation failed:', e.message);
    }
    return res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error('❌ Error updating transaction:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete transaction
export const removeTransaction = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const transaction_id = req.params.transaction_id;
    const deletedTransaction = await deleteTransactionData(transaction_id);
    if (!deletedTransaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }
    await logUserAction(req, 'DELETE_TRANSACTION', `User ${user_id} deleted transaction ${transaction_id}`);
    // Re-evaluate budgets after deletion
    try {
      await evaluateUserBudgetNotifications(user_id);
    } catch (e) {
      console.warn('⚠️ Budget notification evaluation failed:', e.message);
    }
    return res.status(200).json(deletedTransaction);
  } catch (error) {
    console.error('❌ Error deleting transaction:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await getAllTransactionsModel(); // ✅ Call the model function
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('❌ Error fetching all transactions:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }   
};

// --- Bulk import transactions ---
const normalizeDateToMMDDYYYY = (input) => {
  try {
    if (!input) return null;
    const s = String(input).trim();
    // If already MM/DD/YYYY
    const mmdd = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (mmdd.test(s)) return s;
    // ISO YYYY-MM-DD -> MM/DD/YYYY
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (iso.test(s)) {
      const [y, m, d] = s.split('-');
      return `${m}/${d}/${y}`;
    }
    // DD/MM/YYYY -> MM/DD/YYYY (assume swap)
    const ddmm = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (ddmm.test(s)) {
      const [d, m, y] = s.split('/');
      // If first part > 12, definitely day-first
      if (parseInt(d, 10) > 12) return `${m}/${d}/${y}`;
      // Ambiguous; prefer treating input as given if already MM/DD/YYYY above.
    }
    // Fallback: try Date parsing
    const dt = new Date(s);
    if (!isNaN(dt)) {
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const yy = dt.getFullYear();
      return `${mm}/${dd}/${yy}`;
    }
    return null;
  } catch {
    return null;
  }
};

export const importTransactions = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { records } = req.body;
    if (!user_id || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records to import.' });
    }

    const inserted = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i] || {};
      const rawDate = r.Date ?? r.date;
      const description = (r.Description ?? r.description ?? '').toString();
      const categoryName = (r.Category ?? r.category ?? '').toString();
      const typeRaw = (r.Type ?? r.type ?? '').toString().toLowerCase();
      const amountRaw = r.Amount ?? r.amount;

      const date = normalizeDateToMMDDYYYY(rawDate);
      const type = typeRaw === 'income' ? 'income' : typeRaw === 'expense' ? 'expense' : null;
      const amount = parseFloat(amountRaw);

      if (!date || !type || !amount || isNaN(amount)) {
        errors.push({ index: i, error: 'Invalid date/type/amount' });
        continue;
      }
      if (!categoryName) {
        errors.push({ index: i, error: 'Missing category name' });
        continue;
      }

      try {
        const category = await ensureCategoryByName(user_id, categoryName, type);
        const tx = await insertTransaction(user_id, amount, type, category.category_id, description, date);
        inserted.push(tx);
      } catch (e) {
        errors.push({ index: i, error: e.message });
      }
    }

    // Evaluate budgets once if there are any expenses imported
    try {
      if (inserted.some(t => t.type === 'expense')) {
        await evaluateUserBudgetNotifications(user_id);
      }
    } catch (e) {
      console.warn('⚠️ Budget notification evaluation failed:', e.message);
    }

    await logUserAction(req, 'IMPORT_TRANSACTIONS', `User ${user_id} imported ${inserted.length} transactions (${errors.length} errors).`);
    return res.status(200).json({ insertedCount: inserted.length, errorCount: errors.length, errors });
  } catch (error) {
    console.error('❌ Error importing transactions:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
