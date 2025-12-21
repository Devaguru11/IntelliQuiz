async function loadBoard() {
  const res = await fetch("http://localhost:4000/scoreboard/all");
  const data = await res.json();

  const container = document.getElementById("score-list");
  container.innerHTML = "";

  // Logged-in user
  const currentUser = JSON.parse(localStorage.getItem("user"))?.name;

  // Keep BEST attempt per user
  const bestMap = {};

  data.forEach(entry => {
    const name = entry.userId.name;

    if (!bestMap[name] || entry.percentage > bestMap[name].percentage) {
      bestMap[name] = entry;
    }
  });

  // Convert to array & sort
  const leaderboard = Object.values(bestMap)
    .sort((a, b) => b.percentage - a.percentage);

  leaderboard.forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";

    // Highlight top 3
    if (i === 0) row.classList.add("gold");
    if (i === 1) row.classList.add("silver");
    if (i === 2) row.classList.add("bronze");

    // Highlight current user
    if (entry.userId.name === currentUser) {
      row.classList.add("current-user");
    }

    row.innerHTML = `
      <span>#${i + 1}</span>
      <span>${entry.userId.name}</span>
      <span>${entry.score}/${entry.total}</span>
      <span>${entry.percentage}%</span>
    `;

    container.appendChild(row);
  });
}

loadBoard();
