import {
  insertCategory,
  getCategoriesByUser,
  updateCategoryData,
  deleteCategoryData
} from '../models/categories_model.js';

/* ----------------------
   ✅ Controller functions
-----------------------*/

// Add a new category
export const addCategory = async (req, res) => {
  try {
    const { user_id, name, type } = req.body;

    if (!user_id || !name || !type) {
      return res.status(400).json({ error: 'user_id, name, and type are required.' });
    }

    const newCategory = await insertCategory(user_id, name, type);
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error('❌ Error adding category:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all categories for a user
export const getUserCategories = async (req, res) => {
  try {
    user_id = req.params.user_id;
    const categories = await getCategoriesByUser(user_id);
    return res.status(200).json(categories);
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a category
export const updateCategory = async (req, res) => {
  try {
    const category_id = req.params.category_id;
    const { name, type } = req.body;

    const updatedCategory = await updateCategoryData(category_id, name, type);
    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    return res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('❌ Error updating category:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a category
export const removeCategory = async (req, res) => {
  try {
    const category_id = req.params.category_id;
    const deletedCategory = await deleteCategoryData(category_id);
    if (!deletedCategory) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    return res.status(200).json(deletedCategory);
  } catch (error) {
    console.error('❌ Error deleting category:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
