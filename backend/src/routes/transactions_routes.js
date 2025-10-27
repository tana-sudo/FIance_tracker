import express from 'express';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from '../controllers/transactions_controller.js';
const router = express.Router();
router.get('/transactions', getTransactions);
router.post('/addTransaction', addTransaction);
router.put('/updateTransaction/:id', updateTransaction);
router.delete('/deleteTransaction/:id', deleteTransaction);

export default router;