// ===============================
//   IntelliQuiz Backend (FULLY FIXED)
// ===============================

import express from "express";
import cors from "cors";
import multer from "multer";
import { createRequire } from "module";
import OpenAI from "openai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "./models/User.js";
import Score from "./models/Score.js";
import { auth } from "./middleware/auth.js";

// Load CommonJS-only package (pdf-parse)
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ===============================
//  MongoDB Connection
// ===============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));


// ===============================
//  File Upload (PDF)
// ===============================

const upload = multer({ storage: multer.memoryStorage() });


// ===============================
//  OpenAI Client
// ===============================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// ===============================
//  Generate Quiz From Text
// ===============================

async function generateQuizFromText(text, numQ = 5) {
  const prompt = `
Generate ${numQ} MCQs in JSON only:

"${text}"

Return exactly this:
{
  "questions": [
    {
      "question": "",
      "options": ["A","B","C","D"],
      "correct": ""
    }
  ]
}
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const raw = res.choices[0].message.content;

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.log("❌ JSON Parse Error:", raw);
    return { questions: [] };
  }
}


// ===============================
//  AUTH ROUTES
// ===============================

// Signup
app.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already exists" });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });

  res.json({ message: "Signup successful" });
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ message: "Login successful", token, user });
});


// ===============================
//  SCOREBOARD ROUTES
// ===============================

app.post("/scoreboard/save", auth, async (req, res) => {
  const { score, total } = req.body;

  const percentage = Math.round((score / total) * 100);

  await Score.create({
    userId: req.user.id,
    score,
    total,
    percentage
  });

  res.json({ message: "Score saved" });
});

app.get("/scoreboard/all", async (req, res) => {
  const scores = await Score.find()
    .populate("userId", "name email")
    .sort({ percentage: -1 });

  res.json(scores);
});


// ===============================
//  QUIZ ROUTES
// ===============================

// TEXT → QUIZ
app.post("/api/generate-from-text", async (req, res) => {
  try {
    const { topic, num_questions } = req.body;
    const quiz = await generateQuizFromText(topic, num_questions);
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: "Error generating quiz" });
  }
});

// PDF → QUIZ
app.post("/api/generate-from-pdf", upload.single("file"), async (req, res) => {
  try {
    const pdfData = await pdfParse(req.file.buffer);
    const { num_questions } = req.body;

    const quiz = await generateQuizFromText(pdfData.text, num_questions);
    res.json(quiz);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error reading PDF" });
  }
});


// ===============================
//  START SERVER
// ===============================

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 IntelliQuiz Backend running at http://localhost:${PORT}`);
});
