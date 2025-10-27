import pool from '../config/db.js';

const addcategory = async (req, res) => {
    const { name, description } = req.body;
    try {           
        const result = await pool.query(
            `INSERT INTO categories (name, description)
             VALUES ($1, $2)             
                RETURNING id, name, description, created_at`,       );
            [name, description];
        res.status(201).json({
            message: 'Category added successfully',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }                       };

    const getAllCategories = async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT id, name, description, created_at FROM categories ORDER BY id ASC'
            );
            res.status(200).json({
                categories: result.rows
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ message: 'Internal server error' });
        }      };

     const UpdateCategory = async (req, res) => {
        const { id } = req.params;
        const { name, description } = req.body; 
        try {
            const result = await pool.query(
                `UPDATE categories      
                    SET name = $1, description = $2
                    WHERE id = $3
                    RETURNING id, name, description, created_at`,
                [name, description, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Category not found' });
            }   
            res.status(200).json({
                message: 'Category updated successfully',
                category: result.rows[0]
            });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
    
    const DeleteCategory = async (req, res) => {
        const { id } = req.params;
        try {           
            const result = await pool.query(
                'DELETE FROM categories WHERE id = $1 RETURNING id, name, description',
                [id]
            );  
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.status(200).json({
                message: 'Category deleted successfully',
                category: result.rows[0]
            });
        }   catch (error) { 
            console.error('Error deleting category:', error);
            res.status(500).json({ message: 'Internal server error' });
        }   
    };
    
export { addcategory, getAllCategories };