import express from 'express';
import { verifyToken } from '../middlewares/auth_middleware.js';
import {
  addBudget,
  getUserBudgets,
  updateBudget,
  removeBudget
} from '../controllers/budget_controller.js';

const router = express.Router();

router.post('/add_budget', verifyToken, addBudget);
router.get('/get_budgets/:user_id', verifyToken, getUserBudgets);
router.put('/updateBudget/:budget_id', verifyToken, updateBudget);
router.delete('/removeBudget/:budget_id', verifyToken, removeBudget);

export default router;
