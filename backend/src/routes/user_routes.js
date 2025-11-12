import express from 'express';
import { registerUser,updateUser,removeUser,listUsers, getMe, updateMe, changeUserPassword} from '../controllers/users_controller.js';  
import { validateNewUser } from '../middlewares/uservalidation_middleware.js';  
import { verifyToken, authorizeRole } from '../middlewares/auth_middleware.js';
import '../models/user_model.js'; 
const router = express.Router();

//router.get('/login', getUserData);

router.post('/register',validateNewUser,registerUser);

router.get('/getUsers',listUsers); 

router.put('/updateuser/:id',updateUser);

router.delete('/deleteuser/:id',removeUser);
// Current user profile endpoints
router.get('/me', verifyToken, getMe);
router.put('/me', verifyToken, updateMe);

// Admin change password for a user
router.put('/:id/password', verifyToken, authorizeRole('admin'), changeUserPassword);
export default router;