import express from 'express';
import { getUserData, insertUserData } from '../controllers/user_controller.js';    
const router = express.Router();

router.get('/login', getUserData);

router.post('/NewUser', insertUserData);

export default router;