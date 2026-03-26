const API_BASE_URL = "http://localhost:3000";

let bankrollChartInstance = null;

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function renderOverview(data) {
  document.getElementById("statsTitle").textContent =
    `Statistiques de ${data.pseudo}`;
  document.getElementById("statsSubtitle").textContent =
    `Voici les statistiques principales de ton profil.`;

  document.getElementById("totalParties").textContent = data.totalParties;
  document.getElementById("tauxVictoires").textContent = formatPercent(
    data.tauxVictoires,
  );
  document.getElementById("tauxBust").textContent = formatPercent(
    data.tauxBust,
  );
  document.getElementById("tendance").textContent = data.tendance;
}

function renderActions(data) {
  document.getElementById("tirerStats").textContent =
    `${formatPercent(data.actions.tirer.percentage)} (${data.actions.tirer.count})`;

  document.getElementById("resterStats").textContent =
    `${formatPercent(data.actions.rester.percentage)} (${data.actions.rester.count})`;

  document.getElementById("doublerStats").textContent =
    `${formatPercent(data.actions.doubler.percentage)} (${data.actions.doubler.count})`;

  document.getElementById("partagerStats").textContent =
    `${formatPercent(data.actions.partager.percentage)} (${data.actions.partager.count})`;
}

function renderBankrollChart(data) {
  const ctx = document.getElementById("bankrollChart");

  if (!ctx) return;

  if (bankrollChartInstance) {
    bankrollChartInstance.destroy();
  }

  const labels =
    data.bankrollEvolution.length > 0
      ? data.bankrollEvolution.map((item) => `Partie ${item.partie}`)
      : ["Aucune donnée"];

  const values =
    data.bankrollEvolution.length > 0
      ? data.bankrollEvolution.map((item) => item.valeur)
      : [0];

  bankrollChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Bankroll",
          data: values,
          borderColor: "#00ff00",
          backgroundColor: "rgba(0, 255, 0, 0.15)",
          fill: true,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#ffffff",
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#ffffff",
          },
          grid: {
            color: "rgba(255,255,255,0.08)",
          },
        },
        y: {
          ticks: {
            color: "#ffffff",
          },
          grid: {
            color: "rgba(255,255,255,0.08)",
          },
        },
      },
    },
  });
}

async function checkAuth() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include",
  });

  const data = await safeJson(response);

  if (!response.ok || !data.id_joueur) {
    window.location.href = "/table.html";
    return null;
  }

  return data;
}

async function loadStats() {
  try {
    const user = await checkAuth();
    if (!user) return;

    const response = await fetch(
      `${API_BASE_URL}/api/stats/joueur/${user.id_joueur}`,
      {
        credentials: "include",
      },
    );

    const data = await safeJson(response);

    if (!response.ok) {
      alert(data.message || "Impossible de charger les statistiques.");
      return;
    }

    renderOverview(data);
    renderActions(data);
    renderBankrollChart(data);
  } catch (error) {
    console.error("Erreur loadStats :", error);
    alert("Erreur serveur lors du chargement des statistiques.");
  }
}

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    window.location.href = "/table.html";
  } catch (error) {
    console.error("Erreur logout :", error);
  }
}

document.getElementById("logoutBtn").addEventListener("click", logout);

loadStats();
