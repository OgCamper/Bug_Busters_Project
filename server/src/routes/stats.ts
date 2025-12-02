import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import db from "../db.js";
import type { RowDataPacket } from "mysql2";

const router = express.Router();

/**
 * GET /api/stats?range=7d|30d|all
 * Returns study accuracy, streak, and daily progress data.
 */
router.get("/", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const range = req.query.range ?? "7d";

    // Add a SQL date filter for 7-day or 30-day range
    let dateFilter = "";
    if (range === "7d") {
      dateFilter = "AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } else if (range === "30d") {
      dateFilter = "AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    }

    // Query daily quiz/study stats for this user
    const [rows] = await db.query<RowDataPacket[]>(
      `
      SELECT 
        DATE(date) AS date,
        SUM(correct) AS correct,
        SUM(incorrect) AS incorrect
      FROM StudySession
      WHERE user_id = ? ${dateFilter}
      GROUP BY DATE(date)
      ORDER BY DATE(date)
      `,
      [userId]
    );

    // Compute total accuracy
    const totalCorrect = rows.reduce((sum, r) => sum + (r.correct || 0), 0);
    const totalIncorrect = rows.reduce((sum, r) => sum + (r.incorrect || 0), 0);
    const total = totalCorrect + totalIncorrect;
    const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

    // Compute streak (consecutive active days)
    let streak = 0;
    let currentStreak = 0;
    let lastDate: string | null = null;

    rows.forEach((r) => {
      const day = new Date(r.date).toISOString().split("T")[0];
      if (lastDate) {
        const diffDays =
          (new Date(day).getTime() - new Date(lastDate).getTime()) /
          (1000 * 60 * 60 * 24);
        currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
      } else {
        currentStreak = 1;
      }
      lastDate = day;
      streak = Math.max(streak, currentStreak);
    });

    // Respond with data
    res.json({
      range,
      accuracy,
      streak,
      progress: rows.map((r) => ({
        date: r.date,
        correct: r.correct || 0,
        incorrect: r.incorrect || 0,
      })),
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

export default router;