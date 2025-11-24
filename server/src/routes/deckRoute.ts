import express from 'express';
import authenticate from '../middleware/authMiddleware.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import db from '../db.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = express.Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT d.deck_id, d.title, d.description, d.created_at,
                    (SELECT COUNT(*) FROM Flashcard f WHERE f.deck_id = d.deck_id) AS card_count
             FROM Deck d
             WHERE d.user_id = ?
             ORDER BY d.created_at DESC`,
            [userId]
        );

        const decks = rows.map((deck) => ({
            id: deck.deck_id as number,
            title: deck.title as string,
            description: deck.description as string | null,
            created_at: deck.created_at as Date,
            card_count: Number(deck.card_count ?? 0),
        }));

        return res.status(200).json({ decks });
    } catch (err) {
        console.error('Error fetching Decks:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/createDeck', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
        const description = typeof req.body.description === 'string'
            ? req.body.description.trim()
            : null;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const [result] = await db.query<ResultSetHeader>(
            `INSERT INTO Deck (user_id, title, description)
             VALUES (?, ?, ?)`,
            [userId, title, description]
        );

        return res.status(201).json({
            message: 'Deck created successfully',
            deck: {
                id: result.insertId,
                title,
                description: description ?? null,
                user_id: userId,
            },
        });
    } catch (err) {
        console.error('Error creating Deck:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/:deckId', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const deckId = Number(req.params.deckId);

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!Number.isInteger(deckId)) {
            return res.status(400).json({ message: 'deckId must be a number' });
        }

        const [deckRows] = await db.query<RowDataPacket[]>(
            `SELECT deck_id, title, description, created_at
             FROM Deck
             WHERE deck_id = ? AND user_id = ?`,
            [deckId, userId]
        );

        const deck = deckRows[0];

        if (!deck) {
            return res.status(404).json({ message: 'Deck not found' });
        }

        const [cardRows] = await db.query<RowDataPacket[]>(
            `SELECT card_id, front_text, back_text, created_at
             FROM Flashcard
             WHERE deck_id = ?
             ORDER BY created_at DESC`,
            [deckId]
        );

        const cards = cardRows.map((card) => ({
            id: card.card_id as number,
            deck_id: deckId,
            front_text: card.front_text as string,
            back_text: card.back_text as string,
            created_at: card.created_at as Date,
        }));

        return res.status(200).json({
            deck: {
                id: deck.deck_id as number,
                title: deck.title as string,
                description: deck.description as string | null,
                created_at: deck.created_at as Date,
            },
            cards,
        });
    } catch (err) {
        console.error('Error fetching Deck detail:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/:deckId', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const deckId = Number(req.params.deckId);

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!Number.isInteger(deckId)) {
            return res.status(400).json({ message: 'deckId must be a number' });
        }

        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT deck_id, title, description FROM Deck WHERE deck_id = ? AND user_id = ?`,
            [deckId, userId]
        );

        const deck = rows[0];

        if (!deck) {
            return res.status(404).json({ message: 'Deck not found' });
        }

        const hasTitleUpdate = typeof req.body.title === 'string';
        const hasDescriptionUpdate = typeof req.body.description === 'string';

        if (!hasTitleUpdate && !hasDescriptionUpdate) {
            return res.status(400).json({ message: 'Nothing to update' });
        }

        let nextTitle = deck.title as string;
        if (hasTitleUpdate) {
            nextTitle = req.body.title.trim();
            if (!nextTitle) {
                return res.status(400).json({ message: 'Title cannot be empty' });
            }
        }

        let nextDescription = deck.description as string | null;
        if (hasDescriptionUpdate) {
            const trimmed = req.body.description.trim();
            nextDescription = trimmed || null;
        }

        await db.query<ResultSetHeader>(
            `UPDATE Deck SET title = ?, description = ? WHERE deck_id = ? AND user_id = ?`,
            [nextTitle, nextDescription, deckId, userId]
        );

        return res.status(200).json({
            message: 'Deck updated successfully',
            deck: {
                id: deckId,
                title: nextTitle,
                description: nextDescription,
                user_id: userId,
            },
        });
    } catch (err) {
        console.error('Error updating Deck:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete('/:deckId', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const deckId = Number(req.params.deckId);

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!Number.isInteger(deckId)) {
            return res.status(400).json({ message: 'deckId must be a number' });
        }

        const [result] = await db.query<ResultSetHeader>(
            `DELETE FROM Deck WHERE deck_id = ? AND user_id = ?`,
            [deckId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Deck not found' });
        }

        return res.status(200).json({ message: 'Deck deleted successfully' });
    } catch (err) {
        console.error('Error deleting Deck:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;