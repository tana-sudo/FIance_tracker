import pool from '../config/db.js';
import { getBudgetsByUser } from '../models/budget_model.js';
import { getCategoryById } from '../models/categories_model.js';
import {
  insertNotification,
  getNotificationsByUser,
  getUnreadCountByUser,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  hasRecentNotification
} from '../models/notification_model.js';

// Get my notifications
export const getMyNotifications = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const notifications = await getNotificationsByUser(user_id);
    const unreadCount = await getUnreadCountByUser(user_id);
    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark single notification as read
export const setNotificationRead = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { notification_id } = req.params;
    const updated = await markNotificationRead(notification_id, user_id);
    if (!updated) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Error marking notification read:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Mark all notifications as read
export const setAllRead = async (req, res) => {
  try {
    const user_id = req.user?.id;
    await markAllNotificationsRead(user_id);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error marking all notifications read:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete single notification
export const removeNotification = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { notification_id } = req.params;
    const deleted = await deleteNotification(notification_id, user_id);
    if (!deleted) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting notification:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper: compute spent for a budget using transactions table
const getSpentForBudget = async (user_id, category_id, start_date, end_date) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS spent
     FROM transactions
     WHERE user_id = $1 AND category_id = $2 AND type = 'expense'
       AND date BETWEEN $3 AND $4`,
    [user_id, category_id, start_date, end_date]
  );
  return parseFloat(result.rows[0]?.spent || 0);
};

// Evaluate budgets and create notifications (warning at 85%, exceeded at 100%)
export const evaluateUserBudgetNotifications = async (user_id) => {
  const budgets = await getBudgetsByUser(user_id);
  const created = [];

  for (const b of budgets) {
    const spent = await getSpentForBudget(user_id, b.category_id, b.start_date, b.end_date);
    const allocated = parseFloat(b.amount || 0);
    if (allocated <= 0) continue;
    const percentage = (spent / allocated) * 100;
    const cat = await getCategoryById(b.category_id);
    const categoryName = cat?.name || `Category ${b.category_id}`;

    // 3-tier notifications: >=80% used, ==100% used, >100% exceeded
    if (percentage > 100) {
      const already = await hasRecentNotification(user_id, 'budget_exceeded', b.category_id);
      if (!already) {
        const over = (spent - allocated).toFixed(2);
        const msg = `Budget for ${categoryName} exceeded by BWP ${over}. Spent: BWP ${spent.toFixed(2)} of BWP ${allocated.toFixed(2)}.`;
        const n = await insertNotification(user_id, 'budget_exceeded', msg, b.category_id);
        created.push(n);
      }
      continue; // don't also create other tiers when exceeded
    }

    if (Math.round(percentage) === 100) {
      const already = await hasRecentNotification(user_id, 'budget_fully_used', b.category_id);
      if (!already) {
        const msg = `Budget for ${categoryName} is fully used (100%).`;
        const n = await insertNotification(user_id, 'budget_fully_used', msg, b.category_id);
        created.push(n);
      }
      continue;
    }

    if (percentage >= 80) {
      const already = await hasRecentNotification(user_id, 'budget_warning', b.category_id);
      if (!already) {
        const msg = `You have used ${percentage.toFixed(0)}% of your budget for ${categoryName}.`;
        const n = await insertNotification(user_id, 'budget_warning', msg, b.category_id);
        created.push(n);
      }
    }
  }

  return created;
};

// Endpoint to force evaluation
export const checkBudgetsAndNotify = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const created = await evaluateUserBudgetNotifications(user_id);
    const notifications = await getNotificationsByUser(user_id);
    const unreadCount = await getUnreadCountByUser(user_id);
    res.status(200).json({ created, notifications, unreadCount });
  } catch (error) {
    console.error('❌ Error checking budgets:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};