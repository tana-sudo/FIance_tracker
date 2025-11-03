import express from 'express';
import { verifyToken } from '../middlewares/auth_middleware.js';
import { addCategory, getUserCategories, updateCategory, removeCategory } from '../controllers/categories_controller.js';

const router = express.Router();

// All category routes are protected
router.post('/new_categories', verifyToken, addCategory);
router.get('/allcategories/:user_id', verifyToken, getUserCategories);
router.put('/update_categories/:category_id', verifyToken, updateCategory);
router.delete('/del-categories/:category_id', verifyToken, removeCategory);

export default router;
