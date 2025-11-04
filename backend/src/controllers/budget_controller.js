import {
  insertBudget,
  getBudgetsByUser,
  updateBudgetData,
  deleteBudgetData,
  getBudgetsWithSummary
} from '../models/budget_model.js';

// Add new budget
export const addBudget = async (req, res) => {
  try {
    const { category_id, amount, start_date, end_date } = req.body;
    const user_id = req.user?.id ; // from verifyToken middleware

    if (!category_id || !amount) {
      return res.status(400).json({ message: 'Category and amount are required.' });
    }

    const newBudget = await insertBudget(user_id, category_id, amount, start_date, end_date);
    res.status(201).json(newBudget);
  } catch (error) {
    console.error('❌ Error adding budget:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user budgets
export const getUserBudgets = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const budgets = await getBudgetsByUser(user_id);
    res.status(200).json(budgets);
  } catch (error) {
    console.error('❌ Error fetching budgets:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update budget
export const updateBudget = async (req, res) => {
  try {
    const { budget_id } = req.params;
    const { amount, start_date, end_date } = req.body;
    const updatedBudget = await updateBudgetData(budget_id, amount, start_date, end_date);
    if (!updatedBudget) return res.status(404).json({ message: 'Budget not found.' });
    res.status(200).json(updatedBudget);
  } catch (error) {
    console.error('❌ Error updating budget:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete budget
export const removeBudget = async (req, res) => {
  try {
    const { budget_id } = req.params;
    const deletedBudget = await deleteBudgetData(budget_id);
    if (!deletedBudget) return res.status(404).json({ message: 'Budget not found.' });
    res.status(200).json(deletedBudget);
  } catch (error) {
    console.error('❌ Error deleting budget:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBudgetSummary = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const budgets = await getBudgetsWithSummary(user_id, month, year);
    res.status(200).json(budgets);
  } catch (error) {
    console.error('❌ Error fetching budget summary:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

