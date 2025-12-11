import express from "express";
import Score from "../models/Score.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Save score
router.post("/save", authMiddleware, async (req, res) => {
  const { score, total } = req.body;

  const percentage = (score / total) * 100;

  await Score.create({
    userId: req.user.id,
    score,
    total,
    percentage
  });

  res.json({ message: "Score saved" });
});

// Get scoreboard (top scores)
router.get("/all", async (req, res) => {
  const board = await Score.find()
    .populate("userId", "name email")
    .sort({ percentage: -1 });

  res.json(board);
});

export default router;
