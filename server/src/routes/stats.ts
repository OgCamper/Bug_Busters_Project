import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import db from "../db.js";
import type { RowDataPacket } from "mysql2";

const router = express.Router();

/**
 * GET /api/stats?range=7d|30d|all
 */
router.get("/", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const range = req.query.range ?? "7d";

    // Apply date filter
    let dateFilter = "";
    if (range === "7d") {
      dateFilter = "AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
    } else if (range === "30d") {
      dateFilter = "AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
    }

    // Query per-day results
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

    // Convert and calculate totals
    const totalCorrect = rows.reduce(
      (sum, r) => sum + Number(r.correct || 0),
      0
    );
    const totalIncorrect = rows.reduce(
      (sum, r) => sum + Number(r.incorrect || 0),
      0
    );
    const total = totalCorrect + totalIncorrect;
    const accuracy =
      total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

    // Calculate streak (consecutive active days)
    let streak = 0;
    let current = 0;
    let last: string | null = null;

    rows.forEach((r) => {
      const d = new Date(r.date).toISOString().split("T")[0];
      if (last) {
        const diff =
          (new Date(d).getTime() - new Date(last).getTime()) /
          (1000 * 3600 * 24);
        current = diff === 1 ? current + 1 : 1;
      } else current = 1;
      last = d;
      if (current > streak) streak = current;
    });

    // Respond with parsed numeric data
    res.json({
      range,
      accuracy,
      streak,
      progress: rows.map((r) => ({
        date: r.date,
        correct: Number(r.correct || 0),
        incorrect: Number(r.incorrect || 0),
      })),
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

export default router;