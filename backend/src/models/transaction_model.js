import con from '../config/db.js';
// Create table automatically if it doesn't exist
(async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS Transactions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await con.query(createTableQuery);
        console.log('Transaction table is ready');
    } catch (error) {
        console.error('Error Creating Transaction  table:', error.message);
    }
})();
