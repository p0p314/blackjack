import socketManager from "/src/socket/SocketManager.js";
import { ClientEvents } from "/src/socket/SocketEvents.js";

class LobbyManager {
  constructor() {
    this.currentPlayer = null;
    this.players = [];
    this.gameStarting = false;
    this.redirectingToGame = false;
    this.init();
  }

  async safeJson(response) {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  async init() {
    await this.getCurrentUser();

    if (!this.currentPlayer) {
      return;
    }

    try {
      await socketManager.connect();
      console.log("Socket connecté au lobby");

      socketManager.emit(ClientEvents.JOIN_LOBBY, {
        playerId: this.currentPlayer.id_joueur,
        name: this.currentPlayer.pseudo,
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error("Erreur connexion socket:", error);
    }
  }

  async getCurrentUser() {
    try {
      const response = await fetch("http://localhost:3000/api/auth/me", {
        credentials: "include",
      });

      const data = await this.safeJson(response);

      if (response.ok && data.id_joueur) {
        this.currentPlayer = data;
        document.getElementById("userInfo").textContent =
          `Bienvenue, ${data.pseudo}`;
      } else {
        window.location.href = "./home.html";
      }
    } catch (error) {
      console.error("Erreur récupération utilisateur:", error);
      window.location.href = "./home.html";
    }
  }

  setupSocketListeners() {
    socketManager.onLobbyUpdated((data) => {
      console.log("Lobby mis à jour:", data);
      this.players = data.players || [];
      this.updatePlayersList();
      this.updatePlayerCount();
      this.checkStartGameButton();
    });

    socketManager.onPlayerJoined((data) => {
      console.log("Joueur rejoint:", data);
      this.players = data.players || [];
      this.updatePlayersList();
      this.updatePlayerCount();
      this.checkStartGameButton();
    });

    socketManager.onPlayerLeft((data) => {
      console.log("Joueur quitté:", data);
      this.players = data.players || [];
      this.updatePlayersList();
      this.updatePlayerCount();
      this.checkStartGameButton();
    });

    socketManager.onGameStarting((data) => {
      console.log("Partie en cours de démarrage:", data);
      this.gameStarting = true;
      this.redirectingToGame = true;

      const hostPlayerId = data?.players?.[0]?.id;
      const isHost = hostPlayerId === this.currentPlayer?.id_joueur;

      setTimeout(() => {
        window.location.href = `./index.html?host=${isHost ? "1" : "0"}`;
      }, 1200);
    });

    socketManager.onError((error) => {
      console.error("Erreur socket:", error);
    });
  }

  updatePlayersList() {
    const playersList = document.getElementById("playersList");

    if (!this.players || this.players.length === 0) {
      playersList.innerHTML =
        '<li class="empty-state">En attente de joueurs...</li>';
      return;
    }

    playersList.innerHTML = this.players
      .map(
        (player) => `
      <li class="player-item">
        <span class="player-name">${player.name}</span>
        <span class="player-status">${player.status === "ready" ? "Prêt" : "En attente"}</span>
      </li>
    `,
      )
      .join("");
  }

  updatePlayerCount() {
    const count = this.players.length;
    const maxPlayers = 4;
    document.getElementById("playerCount").textContent =
      `${count} / ${maxPlayers} joueurs`;
  }

  checkStartGameButton() {
    const startBtn = document.getElementById("startGameBtn");
    const playersCount = this.players.length;

    const isDealer =
      this.currentPlayer &&
      this.players[0]?.id === this.currentPlayer.id_joueur;

    startBtn.disabled = !(playersCount >= 1 && isDealer && !this.gameStarting);
  }

  leaveLobby() {
    if (this.currentPlayer) {
      socketManager.leaveLobby(this.currentPlayer.id_joueur);
    }
    window.location.href = "./home.html";
  }

  startGame() {
    if (!this.gameStarting && this.players.length > 0) {
      socketManager.startGame();
      console.log("Démarrage de la partie...");
    }
  }
}

const lobbyManager = new LobbyManager();

document.getElementById("startGameBtn").addEventListener("click", () => {
  lobbyManager.startGame();
});

document.getElementById("leaveBtn").addEventListener("click", () => {
  if (confirm("Êtes-vous sûr de vouloir quitter le lobby ?")) {
    lobbyManager.leaveLobby();
  }
});

window.addEventListener("beforeunload", () => {
  if (lobbyManager.currentPlayer && !lobbyManager.redirectingToGame) {
    socketManager.leaveLobby(lobbyManager.currentPlayer.id_joueur);
  }
});
