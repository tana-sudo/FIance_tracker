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
            date VARCHAR NOT NULL,
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


// Insert new transaction
export const insertTransaction = async (user_id, amount, type, category_id, description, date) => {
  const result = await con.query(
    `INSERT INTO transactions (user_id, amount, type, category_id, description, date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING transaction_id, user_id, amount, type, category_id, description, date, created_at, updated_at`,
    [user_id, amount, type, category_id, description, date]
  );
  return result.rows[0];
};

// Get all transactions for a user
export const getTransactionsByUser = async (user_id) => {
  const result = await con.query(
    `SELECT transaction_id, user_id, amount, type, category_id, description, date, created_at, updated_at
     FROM transactions
     WHERE user_id = $1
     ORDER BY date DESC`,
    [user_id]
  );
  return result.rows;
};

// Update transaction
export const updateTransactionData = async (transaction_id, amount, type, category_id, description, date) => {
  const result = await con.query(
    `UPDATE transactions
     SET amount = $1, type = $2, category_id = $3, description = $4, date = $5, updated_at = NOW()
     WHERE transaction_id = $6
     RETURNING transaction_id, user_id, amount, type, category_id, description, date, created_at, updated_at`,
    [amount, type, category_id, description, date, transaction_id]
  );
  return result.rows[0];
};

// Delete transaction
export const deleteTransactionData = async (transaction_id) => {
  const result = await con.query(
    `DELETE FROM transactions WHERE transaction_id = $1
     RETURNING transaction_id, user_id, amount, type, category_id, description, date`,
    [transaction_id]
  );
  return result.rows[0];
};

export { checkAndCreateTransactionsTable };