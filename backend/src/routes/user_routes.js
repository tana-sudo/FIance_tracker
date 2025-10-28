import express from 'express';
import { registerUser,updateUser,removeUser} from '../controllers/users_controller.js';  
import { validate_newUser } from '../middlewares/uservalidation_middleware.js';  
import '../models/user_model.js'; 
const router = express.Router();

//router.get('/login', getUserData);

router.post('/register',validate_newUser,registerUser);

router.put('/update/:id',validate_newUser,updateUser);

router.delete('/delete/:id',removeUser);
export default router;