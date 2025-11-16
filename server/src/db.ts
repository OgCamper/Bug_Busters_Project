import mysql from 'mysql2/promise';

const db = mysql.createPool({
    host: 'db',
    user: 'root',
    database: 'bb-project',
    password: 'my-password',
    waitForConnections: true,
    connectionLimit: 10,
});

export default db;
