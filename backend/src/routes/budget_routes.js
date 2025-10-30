import express from 'express';
import { verifyToken } from '../middlewares/auth_middleware.js';
import {
  addBudget,
  getUserBudgets,
  updateBudget,
  removeBudget
} from '../controllers/budgetController.js';

const router = express.Router();

router.post('/', verifyToken, addBudget);
router.get('/', verifyToken, getUserBudgets);
router.put('/:budget_id', verifyToken, updateBudget);
router.delete('/:budget_id', verifyToken, removeBudget);

export default router;
