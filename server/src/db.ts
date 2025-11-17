import mysql from 'mysql2/promise';

const db = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'bb-project',
    password: process.env.DB_PASSWORD || 'my-password',
    waitForConnections: true,
    connectionLimit: 10,
});

export default db;
