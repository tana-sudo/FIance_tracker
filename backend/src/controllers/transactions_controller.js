
import {
  insertTransaction,
  getTransactionsByUser,
  updateTransactionData,
  deleteTransactionData
} from '../models/transactions_model.js';



// Add new transaction
export const addTransaction = async (req, res) => {
  try {
    const { user_id, amount, type, category_id, description, date } = req.body;

    if (!user_id || !amount || !type || !date) {
      return res.status(400).json({ error: 'user_id, amount, type, and date are required.' });
    }

    const newTransaction = await insertTransaction(user_id, amount, type, category_id, description, date);
    return res.status(201).json(newTransaction);
  } catch (error) {
    console.error('❌ Error adding transaction:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all transactions for a user
export const getUserTransactions = async (req, res) => {
  try {
    const user_id = req.params.user_id;
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

    const updatedTransaction = await updateTransactionData(transaction_id, amount, type, category_id, description, date);
    if (!updatedTransaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
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
    const transaction_id = req.params.transaction_id;
    const deletedTransaction = await deleteTransactionData(transaction_id);
    if (!deletedTransaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    return res.status(200).json(deletedTransaction);
  } catch (error) {
    console.error('❌ Error deleting transaction:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
