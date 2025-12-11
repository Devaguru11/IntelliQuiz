async function loadBoard() {
    const res = await fetch("http://localhost:4000/scoreboard/all");
    const data = await res.json();
  
    const container = document.getElementById("score-list");
    container.innerHTML = "";
  
    data.forEach((entry, i) => {
      const item = document.createElement("p");
      item.innerHTML = `
        <strong>${i+1}. ${entry.userId.name}</strong>
        — Score: ${entry.score}/${entry.total} (${entry.percentage}%)
      `;
      container.appendChild(item);
    });
  }
  
  loadBoard();
  