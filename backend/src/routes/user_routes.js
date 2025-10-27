import express from 'express';
import { insertUserData } from '../controllers/users_controller.js';  
import { validate_newUser } from '../middlewares/uservalidation_middleware.js';   
const router = express.Router();

//router.get('/login', getUserData);

router.post('/NewUser',validate_newUser, insertUserData);

export default router;