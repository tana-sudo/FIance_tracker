import {
  insertCategory,
  getCategoriesByUser,
  updateCategoryData,
  deleteCategoryData
} from '../models/categories_model.js';
import { logUserAction } from '../middlewares/logHelper.js';
/* ----------------------
   ✅ Category Controllers
-----------------------*/

// Add a new category
export const addCategory = async (req, res) => {
  try {
    const { name, type } = req.body;
    const user_id = req.user?.id;

    if (!user_id || !name || !type) {
      return res.status(400).json({ error: 'user_id, name, and type are required.' });
    }
    await logUserAction(req, 'ADD_CATEGORY', `User ${user_id} added category ${name} of type ${type}`);
    const newCategory = await insertCategory(user_id, name, type);
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error('❌ Error adding category:', error.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all categories for a user
export const getUserCategories = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    const categories = await getCategoriesByUser(user_id);
    return res.status(200).json(categories);
  } catch (error) {
    console.error('❌ Error fetching categories:', error.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a category (only by owner)
export const updateCategory = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const category_id = req.params.category_id;
    const { name, type } = req.body;
   
    const category = await getCategoriesByUser(user_id);
    const ownsCategory = category.find(c => c.id == category_id);
    if (!ownsCategory) return res.status(403).json({ error: 'Forbidden. You can only edit your own categories.' });
    await logUserAction(req, 'UPDATE_CATEGORY', `User ${user_id} updated category ${category_id} to name ${name} and type ${type}`);
    const updatedCategory = await updateCategoryData(category_id, name, type);
    return res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('❌ Error updating category:', error.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a category (only by owner)
export const removeCategory = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const category_id = req.params.category_id;

    /*const category = await getCategoriesByUser(user_id);
    const ownsCategory = category.find(c => c.id == category_id);
    if (!ownsCategory) return res.status(403).json({ error: 'Forbidden. You can only delete your own categories.' });*/
    await logUserAction(req, 'DELETE_CATEGORY', `User ${user_id} deleted category ${category_id}`);
    const deletedCategory = await deleteCategoryData(category_id);
    return res.status(200).json(deletedCategory);
  } catch (error) {
    console.error('❌ Error deleting category:', error.stack);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
