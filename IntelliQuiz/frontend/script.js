// script.js — FINAL, STABLE, HACKATHON-SAFE
// Text Quiz + PDF Quiz + Review + Retake + Done

const API_BASE = "http://localhost:4000";

document.addEventListener("DOMContentLoaded", () => {

  /* ================= DOM ================= */
  const btnText = document.getElementById("btnText");
  const btnFile = document.getElementById("btnFile");
  const textPanel = document.getElementById("textPanel");
  const filePanel = document.getElementById("filePanel");
  const topicEl = document.getElementById("topic");
  const fileInput = document.getElementById("fileInput");
  const uploadBox = document.getElementById("uploadBox");
  const generateBtn = document.getElementById("generateBtn");
  const quizArea = document.getElementById("quizArea");
  const status = document.getElementById("status");
  const numQ = document.getElementById("numQ");
  const themeToggle = document.getElementById("themeToggle");

  /* ================= STATE ================= */
  let mode = "text";
  let quizQuestions = [];
  let userAnswers = [];
  let correctAnswers = [];
  let explanations = [];
  let difficulty = "medium";

  /* ================= THEME ================= */
  function applyTheme(theme) {
    document.body.classList.toggle("light", theme === "light");
    themeToggle.textContent = theme === "light" ? "☀️" : "🌙";
  }

  applyTheme(localStorage.getItem("theme") || "dark");

  themeToggle.onclick = () => {
    const next = document.body.classList.contains("light") ? "dark" : "light";
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  /* ================= HELPERS ================= */
  function setMode(m) {
    mode = m;
    btnText.classList.toggle("active", m === "text");
    btnFile.classList.toggle("active", m === "file");
    textPanel.classList.toggle("hidden", m !== "text");
    filePanel.classList.toggle("hidden", m !== "file");
  }

  function loading(on) {
    generateBtn.disabled = on;
    generateBtn.textContent = on ? "⏳ Generating..." : "✨ Generate Quiz";
    status.textContent = on ? "Processing..." : "Ready";
  }

  function inferCorrectIndex(q) {
    const opts = q.options;
    const c = q.correct;
    if (typeof c === "number") return c;
    if (/^[A-D]$/i.test(c)) return c.toUpperCase().charCodeAt(0) - 65;
    return opts.findIndex(o => o.toLowerCase() === c.toLowerCase());
  }

  function resetQuizOnly() {
    renderQuiz(quizQuestions);
  }

  function resetAll() {
    quizQuestions = [];
    userAnswers = [];
    correctAnswers = [];
    explanations = [];
    quizArea.innerHTML = "";
    topicEl.value = "";
    fileInput.value = "";
    setMode("text");
    status.textContent = "Ready";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ================= UI EVENTS ================= */
  btnText.onclick = () => setMode("text");
  btnFile.onclick = () => setMode("file");
  uploadBox.onclick = () => fileInput.click();

  generateBtn.onclick = async () => {

    if (mode === "text") {
      const text = topicEl.value.trim();
      if (!text) {
        alert("Please enter a topic or text");
        return;
      }
      loading(true);
      fetchQuizFromText(text);
      return;
    }

    // FILE MODE (MOST IMPORTANT FIX)
    if (!fileInput.files || fileInput.files.length === 0) {
      alert("Please choose a file first");
      return;
    }

    loading(true);
    fetchQuizFromFile(fileInput.files[0]);
  };

  /* ================= FETCH ================= */
  async function fetchQuizFromText(text) {
    try {
      const res = await fetch(`${API_BASE}/api/generate-from-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: text,
          num_questions: numQ.value,
          difficulty
        })
      });

      const json = await res.json();
      renderQuiz(json.questions || json);
    } catch (err) {
      alert("Failed to generate quiz");
    } finally {
      loading(false);
    }
  }

  async function fetchQuizFromFile(file) {
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("num_questions", numQ.value);
      fd.append("difficulty", difficulty);

      const res = await fetch(`${API_BASE}/api/generate-from-pdf`, {
        method: "POST",
        body: fd
      });

      const json = await res.json();
      renderQuiz(json.questions || json);
    } catch (err) {
      alert("Failed to upload or read file");
    } finally {
      loading(false);
    }
  }

  /* ================= QUIZ RENDER ================= */
  function renderQuiz(questions) {
    quizQuestions = questions;
    userAnswers = [];
    correctAnswers = [];
    explanations = [];
    quizArea.innerHTML = "";

    questions.forEach((q, idx) => {
      explanations[idx] = q.explanation || "No explanation provided.";

      const card = document.createElement("div");
      card.className = "quiz-card";
      card.innerHTML = `<h3>${idx + 1}. ${q.question}</h3>`;

      const ul = document.createElement("ul");
      ul.className = "options-list";

      q.options.forEach((opt, i) => {
        const li = document.createElement("li");
        li.textContent = opt;
        li.onclick = () => {
          userAnswers[idx] = i;
          [...ul.children].forEach(x => x.classList.remove("selected"));
          li.classList.add("selected");
        };
        ul.appendChild(li);
      });

      correctAnswers[idx] = inferCorrectIndex(q);
      card.appendChild(ul);
      quizArea.appendChild(card);
    });

    const submitBtn = document.createElement("button");
    submitBtn.className = "generate-btn";
    submitBtn.textContent = "✅ Submit Quiz";
    submitBtn.onclick = submitQuiz;
    quizArea.appendChild(submitBtn);
  }

  /* ================= SUBMIT & REVIEW ================= */
  async function submitQuiz() {
    let correct = 0;

    quizQuestions.forEach((_, i) => {
      if (userAnswers[i] === correctAnswers[i]) correct++;
    });

    const total = quizQuestions.length;
    const percent = Math.round((correct / total) * 100);

    difficulty = percent >= 80 ? "hard" : percent >= 50 ? "medium" : "easy";

    quizArea.innerHTML = `
      <div class="score-box">
        <h2>Your Score</h2>
        <p><strong>${correct} / ${total}</strong> correct</p>
        <p>${percent}% accuracy</p>
      </div>
    `;

    quizQuestions.forEach((q, i) => {
      const card = document.createElement("div");
      card.className = "quiz-card";
      card.innerHTML = `<h3>${q.question}</h3>`;

      const ul = document.createElement("ul");
      ul.className = "options-list";

      q.options.forEach((opt, j) => {
        const li = document.createElement("li");
        li.textContent = opt;
        if (j === correctAnswers[i]) li.classList.add("correct");
        if (j === userAnswers[i] && j !== correctAnswers[i]) li.classList.add("incorrect");
        ul.appendChild(li);
      });

      const exp = document.createElement("div");
      exp.className = "explanation visible";
      exp.textContent = explanations[i];

      card.appendChild(ul);
      card.appendChild(exp);
      quizArea.appendChild(card);
    });

    /* ACTIONS */
    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "16px";
    actions.style.justifyContent = "center";
    actions.style.marginTop = "24px";

    const retakeBtn = document.createElement("button");
    retakeBtn.className = "generate-btn";
    retakeBtn.textContent = "🔁 Retake Quiz";
    retakeBtn.onclick = resetQuizOnly;

    const doneBtn = document.createElement("button");
    doneBtn.className = "generate-btn";
    doneBtn.style.background = "transparent";
    doneBtn.style.border = "1px solid var(--accent)";
    doneBtn.style.color = "var(--accent)";
    doneBtn.textContent = "✅ Done";
    doneBtn.onclick = resetAll;

    actions.appendChild(retakeBtn);
    actions.appendChild(doneBtn);
    quizArea.appendChild(actions);

    /* SAVE SCORE */
    const token = localStorage.getItem("token");
    if (token) {
      await fetch(`${API_BASE}/scoreboard/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          score: correct,
          total,
          topic: topicEl.value || "File Upload",
          difficulty
        })
      });
    }
  }

  setMode("text");
  loading(false);
});
