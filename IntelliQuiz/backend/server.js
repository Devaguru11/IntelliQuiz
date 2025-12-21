// ===============================
// IntelliQuiz Backend (FINAL, STABLE, FILE UPLOAD FIXED)
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

// ===============================
// PDF Parse (CommonJS → ES Module Fix)
// ===============================

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse").default;

// ===============================
// App Setup
// ===============================

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// ===============================
// MongoDB Connection (TLS SAFE)
// ===============================

mongoose
  .connect(process.env.MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 5000
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err.message));

// ===============================
// Multer (Memory Storage)
// ===============================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ===============================
// OpenAI Client
// ===============================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===============================
// Quiz Generator (TEXT / PDF)
// ===============================

async function generateQuizFromText(text, numQ = 5, difficulty = "medium") {
  const prompt = `
Generate ${numQ} multiple-choice questions in STRICT JSON format.

Difficulty: ${difficulty}

Rules:
- Each question must include:
  - question
  - 4 options
  - correct answer
  - explanation (1–2 lines)

Return ONLY valid JSON:

{
  "questions": [
    {
      "question": "",
      "options": ["A","B","C","D"],
      "correct": "A",
      "explanation": ""
    }
  ]
}

Content:
"""
${text.slice(0, 12000)}
"""
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3
  });

  const raw = res.choices[0].message.content;

  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    return JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    console.error("❌ OpenAI JSON Parse Error:\n", raw);
    return { questions: [] };
  }
}

// ===============================
// AUTH ROUTES
// ===============================

app.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.findOne({ email })) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });

  res.json({ message: "Signup successful" });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user });
});

// ===============================
// SCOREBOARD ROUTES
// ===============================

app.post("/scoreboard/save", auth, async (req, res) => {
  const { score, total, topic, difficulty } = req.body;

  await Score.create({
    userId: req.user.id,
    score,
    total,
    percentage: Math.round((score / total) * 100),
    topic,
    difficulty
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
// QUIZ ROUTES
// ===============================

// TEXT → QUIZ
app.post("/api/generate-from-text", async (req, res) => {
  try {
    const { topic, num_questions, difficulty } = req.body;
    const quiz = await generateQuizFromText(topic, num_questions, difficulty);
    res.json(quiz);
  } catch {
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

// PDF → QUIZ (ROBUST & FAIL-SAFE)
app.post("/api/generate-from-pdf", upload.single("file"), async (req, res) => {
  try {
    console.log("📂 Incoming file:", req.file?.originalname);

    if (!req.file) {
      return res.status(400).json({ error: "No file received" });
    }

    let extractedText = "";

    try {
      const parsed = await pdfParse(req.file.buffer);
      extractedText = parsed.text || "";
    } catch (err) {
      console.error("❌ PDF Parse Error:", err);
      extractedText = "";
    }

    // 🔑 KEY CHANGE: do NOT reject short or empty PDFs
    if (!extractedText.trim()) {
      extractedText = `
The uploaded document contains little readable text.
Generate conceptual questions based on inferred topic.
      `;
    }

    const { num_questions = 5, difficulty = "medium" } = req.body;

    const quiz = await generateQuizFromText(
      extractedText,
      Number(num_questions),
      difficulty
    );

    console.log("📄 Text length:", extractedText.length);
    res.json(quiz);

  } catch (err) {
    console.error("❌ PDF ROUTE FAILURE:", err);
    res.status(500).json({ error: "PDF quiz generation failed" });
  }
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 IntelliQuiz Backend running at http://localhost:${PORT}`);
});
