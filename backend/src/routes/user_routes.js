import express from 'express';
import { registerUser,updateUser,removeUser,listUsers} from '../controllers/users_controller.js';  
import { validateNewUser } from '../middlewares/uservalidation_middleware.js';  
import '../models/user_model.js'; 
const router = express.Router();

//router.get('/login', getUserData);

router.post('/register',validateNewUser,registerUser);

router.get('/getUsers',listUsers); 

router.put('/updateuser/:id',updateUser);

router.delete('/deleteuser/:id',removeUser);
export default router;