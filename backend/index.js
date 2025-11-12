import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { generateAccessToken, generateRefreshToken, verifyToken, refreshAccessToken } from '../backend/src/middlewares/auth_middleware.js';  
import userRoutes from '../backend/src/routes/user_routes.js'; 
import categoryRoutes from '../backend/src/routes/categories_routes.js';
import authRoutes from '../backend/src/routes/auth_routes.js';
import transactionRoutes from '../backend/src/routes/transactions_routes.js';
import budgetRoutes from '../backend/src/routes/budget_routes.js';
import auditLogRoutes from '../backend/src/routes/auditlogs_routes.js';

dotenv.config();
const app = express();
app.use(cors());
const port = process.env.PORT;
app.use(bodyParser.json());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/auditlogs', auditLogRoutes);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
