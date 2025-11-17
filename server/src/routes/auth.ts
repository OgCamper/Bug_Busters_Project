import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// ---------------------- SIGNUP ----------------------
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const [existing] = await db.query<RowDataPacket[]>(
            "SELECT * FROM User WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);
        
        const [result] = await db.query<ResultSetHeader>(
            `INSERT INTO User (name, email, password_hash, role)
             VALUES (?, ?, ?, ?)`,
            [name, email, hashed, 'user']
        );

        const user_id = result.insertId;

        const token = jwt.sign(
            { sub: user_id, email },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        return res.status(201).json({
            message: "User created successfully",
            token,
            user: { id: user_id, name, email, role: "user" }
        });

    } catch (err) {
        console.error("Signup Error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ---------------------- LOGIN ----------------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT * FROM User WHERE email = ?`,
            [email]
        );

        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { sub: user.user_id, email },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
