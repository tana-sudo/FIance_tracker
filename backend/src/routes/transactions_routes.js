import express from 'express';
import { getUserTransactions, addTransaction, updateTransaction, removeTransaction ,getAllTransactions, importTransactions } from '../controllers/transactions_controller.js';
import { verifyToken } from '../middlewares/auth_middleware.js';
const router = express.Router();
router.get('/gettransactions/:user_id',verifyToken ,getUserTransactions);
router.post('/addTransaction',verifyToken ,addTransaction);
router.put('/updateTransaction/:transaction_id',verifyToken ,updateTransaction);
router.delete('/deleteTransaction/:transaction_id',verifyToken ,removeTransaction);
router.get('/getalltransactions',verifyToken ,getAllTransactions); // For testing purposes
router.post('/import', verifyToken, importTransactions);

export default router;