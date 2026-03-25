const modal = document.getElementById("popupLogin");
const authArea = document.getElementById("authArea");
const closeBtn = document.querySelector(".close");

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
  modal.style.display = "block";
}

function closeModal() {
  modal.style.display = "none";
  clearMessage();
  loginForm.reset();
  registerForm.reset();
}

function switchToLogin() {
  loginFormContainer.style.display = "block";
  registerFormContainer.style.display = "none";
  showLoginTab.classList.add("active-tab");
  showRegisterTab.classList.remove("active-tab");
  clearMessage();
}

function switchToRegister() {
  loginFormContainer.style.display = "none";
  registerFormContainer.style.display = "block";
  showRegisterTab.classList.add("active-tab");
  showLoginTab.classList.remove("active-tab");
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
    const response = await fetch("/api/me");
    const data = await safeJson(response);

    if (data.loggedIn) {
      authArea.innerHTML = `
        <div class="user-box">
          <p>Bonjour, ${data.user.pseudo}</p>
          <button id="logoutBtn" class="logout-btn">Se déconnecter</button>
        </div>
      `;

      const logoutBtn = document.getElementById("logoutBtn");
      logoutBtn.addEventListener("click", logout);
    } else {
      authArea.innerHTML = `<a href="#" id="loginBtn" class="connect">Se connecter</a>`;
      attachLoginButtonEvent();
    }
  } catch (error) {
    console.error("Erreur checkAuth :", error);
  }
}

async function logout() {
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
    });

    const data = await safeJson(response);
    alert(data.message || "Déconnexion réussie.");
    await checkAuth();
  } catch (error) {
    console.error("Erreur logout :", error);
    alert("Erreur lors de la déconnexion.");
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
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
