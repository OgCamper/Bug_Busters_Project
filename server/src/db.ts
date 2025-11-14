import mysql from 'mysql2/promise';

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'bb-project',
    password: 'my-password',
    waitForConnections: true,
    connectionLimit: 10,
});

export default db;
