import express from 'express';
import { getUserTransactions, addTransaction, updateTransaction, removeTransaction } from '../controllers/transactions_controller.js';
const router = express.Router();
router.get('/transactions/:user_id', getUserTransactions);
router.post('/addTransaction', addTransaction);
router.put('/updateTransaction/:transaction_id', updateTransaction);
router.delete('/deleteTransaction/:transaction_id', removeTransaction);

export default router;