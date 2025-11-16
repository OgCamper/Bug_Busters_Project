import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

import db from '../db';

const router = express.Router();


router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body

        const [existingUser] = await db.query<RowDataPacket[]>(
            `SELECT * FROM User WHERE email = ?`,
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User with this email already exist' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query<ResultSetHeader>(
            `INSERT INTO User (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, 'user']
        )

        const userId = result.insertId;

        const token = jwt.sign(
            { sub: userId, email },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.status(201).json({ message: 'User created Successfully', token, user: { id: userId, name, email, role: 'user' } });
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({ message: 'Internal server error' })
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.query<RowDataPacket[]>(
            `SELECT * FROM User WHERE email = ?`,
            [email]
        )

        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Username or Password Invalid' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash)

        if (!validPassword) {
            return res.status(400).json({ message: 'Username or Password Invalid' })
        }

        const token = jwt.sign(
            { sub: user.user_id, email },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        return res.status(200).json({ message: 'Login Successful', token, user: { id: user.user_id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Unable to Login', err });
    }
})

export default router;