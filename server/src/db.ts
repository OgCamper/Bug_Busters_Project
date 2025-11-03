import mysql from 'mysql2/promise';

const db = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'test',
    password: 'my-password',
    waitForConnections: true,
    connectionLimit: 10,
});

export default db;
