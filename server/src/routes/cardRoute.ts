import express from 'express';
import authenticate from '../middleware/authMiddleware.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import db from '../db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

router.post('/createCard', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const { deckId, front_text, back_text } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const normalizedDeckId = Number(deckId);
        if (!Number.isInteger(normalizedDeckId)) {
            return res.status(400).json({ message: 'deckId is required' });
        }

        const front = typeof front_text === 'string' ? front_text.trim() : '';
        const back = typeof back_text === 'string' ? back_text.trim() : '';

        if (!front || !back) {
            return res.status(400).json({ message: 'Both front_text and back_text are required' });
        }

        const [deckRows] = await db.query<RowDataPacket[]>(
            `SELECT user_id FROM Deck WHERE deck_id = ?`,
            [normalizedDeckId]
        );

        const deckRow = deckRows[0];

        if (!deckRow) {
            return res.status(404).json({ message: 'Deck not found' });
        }

        if (deckRow.user_id !== userId) {
            return res.status(403).json({ message: 'You do not own this deck' });
        }

        const [result] = await db.query<ResultSetHeader>(
            `INSERT INTO Flashcard (deck_id, front_text, back_text)
             VALUES (?, ?, ?)`,
            [normalizedDeckId, front, back]
        );

        return res.status(201).json({
            message: 'Card created successfully',
            card: {
                id: result.insertId,
                deck_id: normalizedDeckId,
                front_text: front,
                back_text: back,
            },
        });
    } catch (err) {
        console.error('Error creating Card:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/:cardId', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const cardId = Number(req.params.cardId);

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!Number.isInteger(cardId)) {
            return res.status(400).json({ message: 'cardId must be a number' });
        }

        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT c.card_id, c.deck_id, c.front_text, c.back_text, d.user_id
             FROM Flashcard c
             JOIN Deck d ON d.deck_id = c.deck_id
             WHERE c.card_id = ?`,
            [cardId]
        );

        const card = rows[0];

        if (!card) {
            return res.status(404).json({ message: 'Card not found' });
        }

        if (card.user_id !== userId) {
            return res.status(403).json({ message: 'You do not own this card' });
        }

        const hasFrontUpdate = typeof req.body.front_text === 'string';
        const hasBackUpdate = typeof req.body.back_text === 'string';

        if (!hasFrontUpdate && !hasBackUpdate) {
            return res.status(400).json({ message: 'Nothing to update' });
        }

        let nextFront = card.front_text as string;
        if (hasFrontUpdate) {
            nextFront = req.body.front_text.trim();
            if (!nextFront) {
                return res.status(400).json({ message: 'front_text cannot be empty' });
            }
        }

        let nextBack = card.back_text as string;
        if (hasBackUpdate) {
            nextBack = req.body.back_text.trim();
            if (!nextBack) {
                return res.status(400).json({ message: 'back_text cannot be empty' });
            }
        }

        await db.query<ResultSetHeader>(
            `UPDATE Flashcard SET front_text = ?, back_text = ? WHERE card_id = ?`,
            [nextFront, nextBack, cardId]
        );

        return res.status(200).json({
            message: 'Card updated successfully',
            card: {
                id: cardId,
                deck_id: card.deck_id,
                front_text: nextFront,
                back_text: nextBack,
            },
        });
    } catch (err) {
        console.error('Error updating Card:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete('/:cardId', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user?.id;
        const cardId = Number(req.params.cardId);

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!Number.isInteger(cardId)) {
            return res.status(400).json({ message: 'cardId must be a number' });
        }

        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT c.card_id, d.user_id
             FROM Flashcard c
             JOIN Deck d ON d.deck_id = c.deck_id
             WHERE c.card_id = ?`,
            [cardId]
        );

        const card = rows[0];

        if (!card) {
            return res.status(404).json({ message: 'Card not found' });
        }

        if (card.user_id !== userId) {
            return res.status(403).json({ message: 'You do not own this card' });
        }

        await db.query<ResultSetHeader>(
            `DELETE FROM Flashcard WHERE card_id = ?`,
            [cardId]
        );

        return res.status(200).json({ message: 'Card deleted successfully' });
    } catch (err) {
        console.error('Error deleting Card:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;