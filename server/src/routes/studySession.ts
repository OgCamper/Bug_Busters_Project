import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import db from "../db.js";
import type { ResultSetHeader } from "mysql2";

const router = express.Router();

/**
 * POST /api/studySession
 * Body: { deckId, correct, incorrect }
 */
router.post("/", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { deckId, correct, incorrect } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!deckId) return res.status(400).json({ message: "deckId is required" });

    // Insert new session
    await db.query<ResultSetHeader>(
      `INSERT INTO StudySession (user_id, deck_id, correct, incorrect)
       VALUES (?, ?, ?, ?)`,
      [userId, deckId, correct ?? 0, incorrect ?? 0]
    );

    // Update Analytics summary for the user
    await db.query(`
      INSERT INTO Analytics (user_id, accuracy_rate, streak_count, last_active)
      VALUES (?, 
        (SELECT ROUND(SUM(correct)/(SUM(correct)+SUM(incorrect))*100, 2)
         FROM StudySession WHERE user_id = ?),
        (
          SELECT COUNT(DISTINCT DATE(date))
          FROM StudySession 
          WHERE user_id = ?
            AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ),
        NOW()
      )
      ON DUPLICATE KEY UPDATE
        accuracy_rate = VALUES(accuracy_rate),
        streak_count  = VALUES(streak_count),
        last_active   = NOW();
    `, [userId, userId, userId]);

    res.status(201).json({ message: "Study session recorded and analytics updated" });
  } catch (err) {
    console.error("Error recording study session:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
