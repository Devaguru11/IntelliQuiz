## IntelliQuiz AI — Smart AI-Powered Quiz Generator

IntelliQuiz is an AI-powered platform that converts text or documents (PDF, TXT, PPTX) into auto-generated quizzes.
It includes:

✔ AI Quiz Generation (OpenAI)
✔ Login & Signup Authentication (JWT + MongoDB)
✔ Scoreboard Leaderboard
✔ File Upload + Drag & Drop
✔ Full Frontend + Backend Integration

Built for IIT Bombay Hackathon Round 2 — Functional Prototype (60–80% completion).

## 📌 Project Overview

IntelliQuiz helps students, teachers, and professionals convert study material into quizzes instantly.
Users can:

Enter a topic OR upload a document

Generate MCQs using AI

Attempt the quiz directly on the platform

View score & save results

Compete on leaderboard

This prototype demonstrates:

AI inference integration

Document parsing pipeline

Authentication workflow

End-to-end functional UI + backend

## 🏗 Architecture Overview
System Diagram
Frontend (HTML, CSS, JS)
       ↓
Backend API (Node.js + Express)
       ↓
AI Engine (OpenAI API)
       ↓
MongoDB (Users, Scores)

## Workflow
# 1️⃣ Signup / Login

User → Frontend → Backend → MongoDB → JWT Returned

# 2️⃣ Generate Quiz

Input (Topic/File) → Backend →
→ File Parser (pdf-parse)
→ AI Prompt (OpenAI gpt-4o-mini)
→ JSON MCQs returned → Frontend renders quiz

# 3️⃣ Scoreboard

Score → Backend /scoreboard/save → MongoDB
Leaderboard fetch → /scoreboard/all

## ⚙️ Setup Instructions (Local Machine)
# 1. Clone the Repository
git clone https://github.com/your-username/IntelliQuiz-AI.git
cd IntelliQuiz-AI

Backend Setup (Node.js)
# 2. Install Dependencies
cd backend
npm install

# 3. Create .env File

Inside /backend/.env:

OPENAI_API_KEY=your_key_here
MONGO_URI=your_atlas_uri
JWT_SECRET=your_secret_key

# 4. Start Backend
npm run dev


Backend runs at:
👉 http://localhost:4000

Frontend Setup
# 5. Start Frontend

No framework required.

Open frontend/index.html directly OR use VS Code Live Server.

## 🧠 AI Pipeline Overview
Prompt Used

Backend sends this structured request:

Generate {numQ} MCQs in JSON format:
{
  "questions": [
    {
      "question": "...",
      "options": ["A","B","C","D"],
      "correct": "A"
    }
  ]
}


Model used: gpt-4o-mini
Temperature: 0.3 for accuracy

## 🛠 How to Run Locally
# 1. Start backend
cd backend
npm run dev

# 2. Start frontend

Double-click index.html
OR run:

Live Server → Open with live server

# 3. Login / Signup

Generate a token → stored in browser localStorage.

# 4. Generate Quiz

Choose:

Enter topic

Upload PDF/TXT/PPTX

Click Generate Quiz → AI produces MCQs.

# 5. Submit Quiz

Score auto-calculated → saved → displayed.

# 6. View Leaderboard

Sorted by accuracy % (highest first).

# 🔗 API Endpoints
Authentication
Method	Endpoint	Description
POST	/auth/signup	Create user
POST	/auth/login	Login + JWT
Quiz Generation
Method	Endpoint	Description
POST	/api/generate-from-text	Generate quiz from text
POST	/api/generate-from-pdf	Generate quiz from uploaded file
Scoreboard
Method	Endpoint	Description
POST	/scoreboard/save	Save user score
GET	/scoreboard/all	Fetch leaderboard
🧪 Example Input/Output
Input (Topic Text)
"Explain Machine Learning types."

Output (AI JSON)
{
  "questions": [
    {
      "question": "Which of the following is a type of Machine Learning?",
      "options": ["Supervised", "Quantum", "Nuclear", "Static"],
      "correct": "Supervised"
    }
  ]
}

## 📦 List of Dependencies
Backend
express
cors
multer
pdf-parse
openai
dotenv
mongoose
bcrypt
jsonwebtoken
nodemon

Frontend

Pure:

HTML, CSS, JavaScript


No framework used.

## 👥 Contributors

Devaguru Nanduri	Full-stack, AI Integration,
M Harshith	Frontend / UI	,
Srinivas	Backend / DB	,
K Vishnu	Documentation / Testing	.


## 🏁 Project Status (Round 2 Completion: 60–80%)

✔ AI Quiz Generator working
✔ Auth + JWT working
✔ Scoreboard functional
✔ UI connected to backend
✔ End-to-end flow complete
