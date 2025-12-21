import express from "express";
import Score from "../models/Score.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Save score
router.post("/save", auth, async (req, res) => {
  const { score, total, topic, difficulty } = req.body;
  const percentage = Math.round((score / total) * 100);

  await Score.create({
    userId: req.user.id,
    score,
    total,
    percentage,
    topic,
    difficulty
  });

  res.json({ message: "Score saved" });
});

// Leaderboard (best per user)
router.get("/all", async (req, res) => {
  const scores = await Score.aggregate([
    { $sort: { percentage: -1 } },
    {
      $group: {
        _id: "$userId",
        best: { $first: "$$ROOT" }
      }
    },
    { $replaceRoot: { newRoot: "$best" } }
  ]);

  res.json(scores);
});

export default router;
