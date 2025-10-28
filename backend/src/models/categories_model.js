import con from '../config/db.js';

const checkAndCreateCategoriesTable = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS categories (
            category_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(50) NOT NULL,
            type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `;
    
    try {
        await con.query(createTableQuery);
        console.log(' Categories table is ready');
    } catch (error) {
        console.error('Error creating categories table:', error.message);
    }
};

// Execute the function
checkAndCreateCategoriesTable();

export { checkAndCreateCategoriesTable };