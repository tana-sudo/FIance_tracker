import express from 'express';
import postgres from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = postgres;  
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database:   process.env.DB_NAME,
    password:  process.env.DB_PASSWORD,
    port: process.env.DB_PORT,     

});
(async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
})();
export default pool;
