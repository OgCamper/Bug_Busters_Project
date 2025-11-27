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

        // Load decks owned by user + decks shared with user
        const [rows] = await db.query<RowDataPacket[]>(
            `
            SELECT 
                d.deck_id,
                d.title,
                d.description,
                d.created_at,
                (SELECT COUNT(*) FROM Flashcard f WHERE f.deck_id = d.deck_id) AS card_count,
                'owner' AS source
            FROM Deck d
            WHERE d.user_id = ?

            UNION

            SELECT 
                d.deck_id,
                d.title,
                d.description,
                d.created_at,
                (SELECT COUNT(*) FROM Flashcard f WHERE f.deck_id = d.deck_id) AS card_count,
                'shared' AS source
            FROM Collaboration c
            JOIN Deck d ON c.deck_id = d.deck_id
            WHERE c.user_id = ?
            ORDER BY created_at DESC
            `,
            [userId, userId]
        );

        const decks = rows.map((deck) => ({
            id: deck.deck_id as number,
            title: deck.title as string,
            description: deck.description as string | null,
            created_at: deck.created_at as Date,
            card_count: Number(deck.card_count ?? 0),
            source: deck.source as string
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
            `
            SELECT 
                d.deck_id, 
                d.title, 
                d.description, 
                d.created_at, 
                d.user_id AS owner_id,
                c.role AS shared_role
            FROM Deck d
            LEFT JOIN Collaboration c 
                ON c.deck_id = d.deck_id AND c.user_id = ?
            WHERE d.deck_id = ?
                AND (d.user_id = ? OR c.user_id IS NOT NULL)
            `,
            [userId, deckId, userId]
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
                id: deck.deck_id,
                title: deck.title,
                description: deck.description,
                created_at: deck.created_at,
                owner_id: deck.owner_id,
                role: deck.shared_role ?? "owner",
            },
            cards
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

// Share a deck with another user
router.post("/:deckId/share", async (req, res) => {
  const { deckId } = req.params;
  const { email, role } = req.body;

  try {
    // returns [rows, fields]
    const [rows] = await db.query(
      "SELECT user_id FROM User WHERE email = ?",
      [email]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const sharedUserId = (rows as any[])[0].user_id;

    // Insert collaboration row
    await db.query(
      `INSERT INTO Collaboration (deck_id, user_id, role)
       VALUES (?, ?, ?)`,
      [deckId, sharedUserId, role]
    );

    return res.json({ message: "Deck shared successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error sharing deck" });
  }
});

// Leave a shared deck (remove collaboration)
router.delete("/:deckId/leave", authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { deckId } = req.params;

  try {
    const [result] = await db.query(
      `DELETE FROM Collaboration WHERE deck_id = ? AND user_id = ?`,
      [deckId, userId]
    );

    return res.json({ message: "Left deck successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to leave deck" });
  }
});

export default router;