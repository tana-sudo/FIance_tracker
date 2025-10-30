import express from 'express';
import { verifyToken } from '../middlewares/auth_middleware.js';
import { addCategory, getUserCategories, updateCategory, removeCategory } from '../controllers/categories_controller.js';

const router = express.Router();

// All category routes are protected
router.post('/new_categories', verifyToken, addCategory);
router.get('/allcategories', verifyToken, getUserCategories);
router.put('/categories/:category_id', verifyToken, updateCategory);
router.delete('/categories/:category_id', verifyToken, removeCategory);

export default router;
