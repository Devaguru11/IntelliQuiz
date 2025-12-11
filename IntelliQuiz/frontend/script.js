// script.js — robust, diagnostic, index-based selection & scoring

const API_BASE = "http://localhost:4000";

document.addEventListener("DOMContentLoaded", () => {
  // DOM refs (safe to query after DOMContentLoaded)
  const btnText = document.getElementById("btnText");
  const btnFile = document.getElementById("btnFile");
  const textPanel = document.getElementById("textPanel");
  const filePanel = document.getElementById("filePanel");
  const topicEl = document.getElementById("topic");
  const fileInput = document.getElementById("fileInput");
  const generateBtn = document.getElementById("generateBtn");
  const quizArea = document.getElementById("quizArea");
  const status = document.getElementById("status");
  const numQ = document.getElementById("numQ");
  const uploadBox = document.getElementById("uploadBox");
  const themeToggle = document.getElementById("themeToggle");

  if (!generateBtn || !quizArea || !status) {
    console.error("Missing expected DOM elements. Check your index.html IDs.");
    return;
  }

  // state
  let mode = "text"; // 'text' | 'file'
  let userAnswers = [];      // stores selected option index per question
  let correctAnswers = [];   // stores correct option index per question

  // ---------- helpers ----------
  function logStatus(txt, important = false) {
    status.textContent = txt;
    if (important) console.warn("STATUS:", txt);
  }

  function setMode(newMode) {
    mode = newMode;
    if (mode === "text") {
      btnText?.classList?.add("active");
      btnFile?.classList?.remove("active");
      textPanel?.classList?.remove("hidden");
      filePanel?.classList?.add("hidden");
    } else {
      btnFile?.classList?.add("active");
      btnText?.classList?.remove("active");
      filePanel?.classList?.remove("hidden");
      textPanel?.classList?.add("hidden");
    }
  }

  // safe parse that tolerates backend returning string or object
  async function parseJSONSafe(response) {
    const txt = await response.text();
    try {
      return JSON.parse(txt);
    } catch (e) {
      // sometimes backend returns object-as-string inside JSON, try to find braces
      const firstBrace = txt.indexOf("{");
      const lastBrace = txt.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          return JSON.parse(txt.slice(firstBrace, lastBrace + 1));
        } catch (e2) {
          console.error("Second parse attempt failed:", e2);
        }
      }
      throw new Error("Failed to parse JSON from backend. Response text saved to console.");
    }
  }

  // infer correct index from common response shapes
  function inferCorrectIndex(q) {
    // q.options = ["A", "B", "C"], q.correct might be:
    // - exact option text ("TCP/IP")
    // - an index number (0,1,2)
    // - a letter "A"/"B"/"C"/"D"
    // - option like "C) TCP/IP"
    const opts = Array.isArray(q.options) ? q.options : [];
    const corr = q.correct;

    if (typeof corr === "number") {
      if (corr >= 0 && corr < opts.length) return corr;
    }

    if (typeof corr === "string") {
      const trimmed = corr.trim();

      // letter -> index
      const letterMatch = /^[A-D]$/i.test(trimmed);
      if (letterMatch) {
        const idx = trimmed.toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < opts.length) return idx;
      }

      // string equal to option text
      const equalIdx = opts.findIndex(o => o.trim().toLowerCase() === trimmed.toLowerCase());
      if (equalIdx !== -1) return equalIdx;

      // maybe backend returned "C) TCP/IP" or "C. TCP/IP"
      const letterDot = trimmed.match(/^([A-Da-d])[.)]\s*(.+)$/);
      if (letterDot) {
        const idx = letterDot[1].toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < opts.length) return idx;
        // fallback: compare remainder with options
        const remainder = letterDot[2].trim();
        const rIdx = opts.findIndex(o => o.trim().toLowerCase() === remainder.toLowerCase());
        if (rIdx !== -1) return rIdx;
      }

      // last resort: find option containing correct string
      const containsIdx = opts.findIndex(o => trimmed.length > 2 && o.toLowerCase().includes(trimmed.toLowerCase()));
      if (containsIdx !== -1) return containsIdx;
    }

    // unable to infer
    return -1;
  }

  // ---------- UI wiring ----------
  btnText?.addEventListener("click", () => setMode("text"));
  btnFile?.addEventListener("click", () => setMode("file"));

  uploadBox?.addEventListener("click", () => fileInput.click());
  uploadBox?.addEventListener("dragover", (e) => { e.preventDefault(); uploadBox.classList.add("drag-over"); });
  uploadBox?.addEventListener("dragleave", (e) => { e.preventDefault(); uploadBox.classList.remove("drag-over"); });
  uploadBox?.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("drag-over");
    if (e.dataTransfer?.files?.length) {
      fileInput.files = e.dataTransfer.files;
      setMode("file");
      logStatus(`Selected file: ${fileInput.files[0].name}`);
    }
  });

  fileInput?.addEventListener("change", () => {
    if (fileInput.files.length) {
      setMode("file");
      logStatus(`Selected file: ${fileInput.files[0].name}`);
    }
  });

  themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeToggle.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  });

  // guard: ensure button actually triggers (duplicate listeners avoided)
  generateBtn?.addEventListener("click", onGenerateClick);

  function onGenerateClick(e) {
    e.preventDefault();
    // Basic login protection (if you want to test without login, temporarily comment out)
    // if (!localStorage.getItem("token")) { alert("Please login to generate quizzes."); window.location.href = "login.html"; return; }

    // Decide mode and call generation
    if (mode === "text") {
      const t = (topicEl?.value || "").trim();
      if (!t) {
        alert("Please enter a topic or paste text.");
        return;
      }
      requestQuizFromText(t, Number(numQ?.value || 5));
    } else {
      const f = fileInput?.files?.[0];
      if (!f) { alert("Please select a file."); return; }
      requestQuizFromFile(f, Number(numQ?.value || 5));
    }
  }

  // ---------- server requests ----------
  async function requestQuizFromText(text, count) {
    logStatus("Sending text to backend...");
    loading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/generate-from-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: text, num_questions: count })
      });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Server returned ${resp.status} — ${t}`);
      }

      const json = await parseJSONSafe(resp);
      consumeQuiz(json);
    } catch (err) {
      console.error("requestQuizFromText error:", err);
      alert("Failed to generate quiz: " + (err.message || err));
      logStatus("Error: " + (err.message || "Unknown"));
    } finally {
      loading(false);
    }
  }

  async function requestQuizFromFile(file, count) {
    logStatus("Uploading file to backend...");
    loading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("num_questions", String(count));

      const resp = await fetch(`${API_BASE}/api/generate-from-pdf`, { method: "POST", body: fd });

      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`Server returned ${resp.status} — ${t}`);
      }

      const json = await parseJSONSafe(resp);
      consumeQuiz(json);
    } catch (err) {
      console.error("requestQuizFromFile error:", err);
      alert("Failed to read file / generate quiz: " + (err.message || err));
      logStatus("Error: " + (err.message || "Unknown"));
    } finally {
      loading(false);
    }
  }

  // ---------- consume quiz (unified) ----------
  function consumeQuiz(payload) {
    // Accept multiple shapes:
    // {questions: [...] } OR directly array [...]
    let questions = [];
    if (!payload) {
      alert("Empty response from backend.");
      return;
    }

    if (Array.isArray(payload)) {
      questions = payload;
    } else if (Array.isArray(payload.questions)) {
      questions = payload.questions;
    } else if (Array.isArray(payload.data?.questions)) {
      questions = payload.data.questions;
    } else {
      console.warn("Unrecognized payload shape:", payload);
      // try to find any array value
      for (const k in payload) {
        if (Array.isArray(payload[k])) { questions = payload[k]; break; }
      }
    }

    if (!questions.length) {
      quizArea.innerHTML = `<div class="quiz-card">No questions generated. Backend returned no items.</div>`;
      console.log("Payload:", payload);
      return;
    }

    renderQuiz(questions);
  }

  // ---------- render quiz, store indexes ----------
  function renderQuiz(questions) {
    quizArea.innerHTML = "";
    userAnswers = [];
    correctAnswers = [];

    questions.forEach((q, idx) => {
      const card = document.createElement("div");
      card.className = "quiz-card";

      const qText = q.question || q.q || q.prompt || "Untitled question";
      const title = document.createElement("h3");
      title.textContent = `${idx + 1}. ${qText}`;
      card.appendChild(title);

      // ensure options exist or create placeholders
      const opts = Array.isArray(q.options) && q.options.length ? q.options : (
        Array.isArray(q.choices) ? q.choices : []
      );

      const options = opts.length ? opts.slice(0,4) : ["Option A","Option B","Option C","Option D"];

      // determine correct index robustly
      const cIdx = inferCorrectIndex({ options, correct: q.correct ?? q.answer ?? q.correct_option ?? q.key });
      correctAnswers[idx] = cIdx >= 0 ? cIdx : 0; // default to 0 if unknown (so scoring works)

      const ul = document.createElement("ul");
      ul.className = "options-list";

      options.forEach((opt, i) => {
        const li = document.createElement("li");
        li.textContent = opt;
        li.tabIndex = 0;

        li.onclick = () => {
          userAnswers[idx] = i;
          Array.from(ul.children).forEach(ch => ch.classList.remove("selected"));
          li.classList.add("selected");
        };

        li.onkeypress = (ev) => { if (ev.key === "Enter") li.click(); };

        ul.appendChild(li);
      });

      card.appendChild(ul);

      // optional explanation
      if (q.explanation || q.explain) {
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = "💡 " + (q.explanation || q.explain);
        card.appendChild(p);
      }

      quizArea.appendChild(card);
    });

    // submit button
    const submit = document.createElement("button");
    submit.className = "generate-btn";
    submit.textContent = "Submit Quiz";
    submit.onclick = onSubmit;
    quizArea.appendChild(submit);

    // scroll to quiz
    submit.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ---------- on submit: evaluate + save ----------
  async function onSubmit() {
    // compute score by index equality
    let correct = 0;
    for (let i = 0; i < correctAnswers.length; i++) {
      if (userAnswers[i] === correctAnswers[i]) correct++;
    }

    const total = correctAnswers.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;

    // show results and highlight correct/incorrect
    quizArea.innerHTML = `
      <div class="score-box">
        <h2>Your Score</h2>
        <p><strong>${correct} / ${total}</strong> correct</p>
        <p>${percent}% accuracy</p>
        <p>${percent >= 80 ? "🔥 Excellent!" : percent >= 50 ? "🙂 Good" : "⚠ More practice needed"}</p>
      </div>
    `;

    // save to backend if logged
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${API_BASE}/scoreboard/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ score: correct, total })
        });
        logStatus("Score saved to server.", true);
      } catch (e) {
        console.warn("Failed to save score:", e);
      }
    } else {
      logStatus("Not logged in: score not saved.", true);
    }
  }

  // ---------- loading UI ----------
  function loading(on) {
    generateBtn.disabled = !!on;
    generateBtn.textContent = on ? "⏳ Generating..." : "✨ Generate Quiz";
    status.textContent = on ? "Processing..." : "Ready";
  }

  // initial UI state
  setMode("text");
  loading(false);
});
