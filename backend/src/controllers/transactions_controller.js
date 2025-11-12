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
