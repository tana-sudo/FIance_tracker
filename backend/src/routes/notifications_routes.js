import express from 'express';
import { verifyToken } from '../middlewares/auth_middleware.js';
import {
  getMyNotifications,
  setNotificationRead,
  setAllRead,
  removeNotification,
  checkBudgetsAndNotify
} from '../controllers/notification_controller.js';

const router = express.Router();

// Get my notifications
router.get('/my', verifyToken, getMyNotifications);

// Mark one as read
router.put('/read/:notification_id', verifyToken, setNotificationRead);

// Mark all as read
router.put('/read-all', verifyToken, setAllRead);

// Delete one
router.delete('/delete/:notification_id', verifyToken, removeNotification);

// Trigger budget check
router.post('/check-budgets', verifyToken, checkBudgetsAndNotify);

export default router;