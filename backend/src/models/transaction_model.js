import con from '../config/db.js';

const checkAndCreateTransactionsTable = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS transactions (
            transaction_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            amount DECIMAL(12,2) NOT NULL,
            type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
            category_id INT,
            description TEXT,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `;
    
    try {
        await con.query(createTableQuery);
        console.log('✓ Transactions table is ready');
    } catch (error) {
        console.error('Error creating transactions table:', error.message);
    }
};

// Execute the function
checkAndCreateTransactionsTable();

export { checkAndCreateTransactionsTable };