import con from '../config/db.js';

const checkAndCreateTable = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await con.query(createTableQuery);
        console.log('Users table is ready');
    } catch (error) {
        console.error('Error creating users table:', error.message);
    }
};

// Execute immediately
checkAndCreateTable();

export default { checkAndCreateTable };
