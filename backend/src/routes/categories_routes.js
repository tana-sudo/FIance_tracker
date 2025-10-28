import express from 'express';
import { addCategory, getUserCategories, updateCategory, removeCategory } from '../controllers/categories_controller.js';
const router = express.Router();

router.post('/new', addCategory);
router.get('/all/:user_id', getUserCategories);
router.put('/update/:category_id', updateCategory);
router.delete('/delete/:category_id', removeCategory);   

export default router;