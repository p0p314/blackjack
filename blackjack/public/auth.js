const getApiBaseUrl = () => {
  const fromGlobal = window.__API_BASE_URL__;
  if (typeof fromGlobal === "string" && fromGlobal.trim()) {
    return fromGlobal.replace(/\/$/, "");
  }
  return ""; // same-origin by default
};

const API_BASE_URL = getApiBaseUrl();

const modal = document.getElementById("popupLogin");
const authArea = document.getElementById("authArea");
const closeBtn = document.querySelector(".modal-close");

const showLoginTab = document.getElementById("showLoginTab");
const showRegisterTab = document.getElementById("showRegisterTab");

const loginFormContainer = document.getElementById("loginFormContainer");
const registerFormContainer = document.getElementById("registerFormContainer");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const messageBox = document.getElementById("messageBox");

function showMessage(message, isError = true) {
  messageBox.textContent = message;
  messageBox.style.color = isError ? "red" : "green";
}

function clearMessage() {
  messageBox.textContent = "";
}

function openModal() {
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
  clearMessage();
  loginForm.reset();
  registerForm.reset();
}

function switchToLogin() {
  loginFormContainer.style.display = "block";
  registerFormContainer.style.display = "none";
  showLoginTab.classList.add("active");
  showRegisterTab.classList.remove("active");
  clearMessage();
}

function switchToRegister() {
  loginFormContainer.style.display = "none";
  registerFormContainer.style.display = "block";
  showRegisterTab.classList.add("active");
  showLoginTab.classList.remove("active");
  clearMessage();
}

function attachLoginButtonEvent() {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  }
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });

    const data = await safeJson(response);
    const playBtn = document.getElementById("playBtn");

    if (response.ok && data.id_joueur) {
      authArea.innerHTML = `
        <div class="user-box">
          <p>Bonjour, ${data.pseudo}</p>
          <button id="statsBtn" class="btn btn-stats">Statistiques</button>
          <button id="logoutBtn" class="logout-btn">Se déconnecter</button>
        </div>
      `;

      if (playBtn) {
        playBtn.classList.remove("hidden");
      }

      const logoutBtn = document.getElementById("logoutBtn");
      const statsBtn = document.getElementById("statsBtn");

      if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
      }

      if (statsBtn) {
        statsBtn.addEventListener("click", () => {
          window.location.href = "/stats.html";
        });
      }
    } else {
      authArea.innerHTML = `<button id="loginBtn" class="btn btn-primary">Se connecter</button>`;

      if (playBtn) {
        playBtn.classList.add("hidden");
      }

      attachLoginButtonEvent();
    }
  } catch (error) {
    console.error("Erreur checkAuth :", error);
  }
}

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    await checkAuth();
  } catch (error) {
    console.error("Erreur logout :", error);
  }
}

closeBtn.addEventListener("click", closeModal);

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

showLoginTab.addEventListener("click", switchToLogin);
showRegisterTab.addEventListener("click", switchToRegister);

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  const pseudo = document.getElementById("loginPseudo").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ pseudo, password }),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      showMessage(data.message || "Erreur de connexion.");
      return;
    }

    showMessage(data.message || "Connexion réussie.", false);

    setTimeout(async () => {
      closeModal();
      await checkAuth();
    }, 700);
  } catch (error) {
    console.error("Erreur login :", error);
    showMessage("Erreur serveur.");
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage();

  const pseudo = document.getElementById("registerPseudo").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ pseudo, password }),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      showMessage(data.message || "Erreur d'inscription.");
      return;
    }

    showMessage(data.message || "Compte créé avec succès.", false);

    setTimeout(async () => {
      closeModal();
      await checkAuth();
    }, 700);
  } catch (error) {
    console.error("Erreur register :", error);
    showMessage("Erreur serveur.");
  }
});

attachLoginButtonEvent();
checkAuth();

const playBtn = document.getElementById("playBtn");
if (playBtn) {
  playBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "./lobby.html";
  });
}
