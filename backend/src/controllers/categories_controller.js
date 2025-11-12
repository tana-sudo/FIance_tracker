import {
  insertCategory,
  getCategoriesByUser,
  updateCategoryData,
  deleteCategoryData,
  getAllCategoriesModel,
  getCategoryById
} from '../models/categories_model.js';
import { logUserAction } from '../middlewares/logHelper.js';
/* ----------------------
   ✅ Category Controllers
-----------------------*/

// Add a new category
export const addCategory = async (req, res) => {
  try {
    const { name,type } = req.body;
    const user_id = req.user?.id;
    //const type = 'Global';

    if (!user_id || !name) {
      return res.status(400).json({ error: 'user_id and name are required.' });
    }
    await logUserAction(req, 'ADD_CATEGORY', `User ${user_id} added category ${name} (${type})`);
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
    const user_role = req.user?.role;
    const category_id = req.params.category_id;
    const { name } = req.body;
    const type = 'Global';
   
    if (!user_id || !category_id || !name) {
      return res.status(400).json({ error: 'user_id, category_id and name are required.' });
    }

    const category = await getCategoryById(category_id);
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    // Allow owner to edit, or admin to edit Global categories
    const isOwner = category.user_id === user_id;
    const isAdminEditingGlobal = user_role === 'admin' && category.type === 'Global';
    if (!isOwner && !isAdminEditingGlobal) {
      return res.status(403).json({ error: 'Forbidden. Only owners can edit, or admins for Global categories.' });
    }

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

export const getAllCategories = async (req, res) => {
  try {
    const categories = await getAllCategoriesModel(); // ✅ Call the model function   
    return res.status(200).json(categories);
  } catch (error) {
    console.error('❌ Error fetching all categories:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
