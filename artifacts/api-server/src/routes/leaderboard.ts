import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { db, leaderboardTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/leaderboard — fetch top 50 entries (all users can see)
router.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const { subject } = req.query;

    const query = db
      .select({
        id: leaderboardTable.id,
        userId: leaderboardTable.userId,
        displayName: leaderboardTable.displayName,
        avatarUrl: leaderboardTable.avatarUrl,
        score: leaderboardTable.score,
        questionsAnswered: leaderboardTable.questionsAnswered,
        correctAnswers: leaderboardTable.correctAnswers,
        subject: leaderboardTable.subject,
        updatedAt: leaderboardTable.updatedAt,
      })
      .from(leaderboardTable)
      .orderBy(desc(leaderboardTable.score))
      .limit(50);

    const entries = subject
      ? await db
          .select()
          .from(leaderboardTable)
          .where(eq(leaderboardTable.subject, subject as string))
          .orderBy(desc(leaderboardTable.score))
          .limit(50)
      : await query;

    res.json({ success: true, data: entries });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch leaderboard" });
  }
});

// POST /api/leaderboard/score — submit/update a user's score
router.post("/leaderboard/score", async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req);
    const {
      displayName,
      avatarUrl,
      score,
      questionsAnswered,
      correctAnswers,
      subject,
      guestId,
    } = req.body;

    // Use Clerk userId if logged in, else guestId from body
    const userId = auth.userId || guestId;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "No user identity provided" });
    }

    if (!displayName || typeof score !== "number") {
      return res
        .status(400)
        .json({ success: false, error: "displayName and score are required" });
    }

    // Upsert: update if user exists, insert if new
    const existing = await db
      .select()
      .from(leaderboardTable)
      .where(eq(leaderboardTable.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      // Only update if new score is higher
      if (score > existing[0].score) {
        await db
          .update(leaderboardTable)
          .set({
            displayName,
            avatarUrl: avatarUrl || existing[0].avatarUrl,
            score,
            questionsAnswered:
              questionsAnswered ?? existing[0].questionsAnswered,
            correctAnswers: correctAnswers ?? existing[0].correctAnswers,
            subject: subject || existing[0].subject,
            updatedAt: new Date(),
          })
          .where(eq(leaderboardTable.userId, userId));
      }
    } else {
      await db.insert(leaderboardTable).values({
        userId,
        displayName,
        avatarUrl,
        score,
        questionsAnswered: questionsAnswered ?? 0,
        correctAnswers: correctAnswers ?? 0,
        subject,
      });
    }

    // Return the user's current rank
    const rankResult = await db.execute(
      sql`SELECT COUNT(*) as rank FROM ${leaderboardTable} WHERE score > ${score}`,
    );
    const rank = Number((rankResult.rows[0] as any).rank) + 1;

    res.json({ success: true, rank });
  } catch (err) {
    console.error("Leaderboard score error:", err);
    res.status(500).json({ success: false, error: "Failed to update score" });
  }
});

export default router;
