import { loadAssets } from "./Manager/AssetsManager.js";
import SceneRenderer from "./ui/SceneRenderer.js";
import GameState from "./state/GameState.js";
import { socket } from "./socket/Socket.js";
import { fetchCurrentUser as fetchCurrentUserApi } from "./api/authApi.js";
import { registerClientEvents } from "./socket/registerClientEvents.js";
import globals from "globals";

const CARD_WIDTH = 90;
const CARD_HEIGHT = 135;

const CARD_SPACING = CARD_WIDTH + 10;
const MAX_PLAYERS = 4;
class BlackjackApp {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.renderer = new SceneRenderer(this.canvas, {
      cardWidth: CARD_WIDTH,
      cardHeight: CARD_HEIGHT,
      cardSpacing: CARD_SPACING,
      maxPlayers: MAX_PLAYERS,
    });

    this.state = new GameState();

    this.isHost = (() => {
      const hostParam = new URLSearchParams(window.location.search).get("host");
      if (hostParam === null) return true;
      return hostParam === "1";
    })();
  }

  scheduleInitialCardsRequest() {
    if (this.state.initialCardsRequested) return;
    this.state.initialCardsRequested = true;

    const delay = this.isHost ? 300 : 1800;
    setTimeout(() => {
      if (this.isHost || !this.state.hasInitialCards) {
        socket.waitingInitialCards();
      }
    }, delay);
  }

  async init() {
    this.prepareCanvas();
    await loadAssets();
    await this.fetchCurrentUser();
    this.renderer.buildStaticBackground();
    this.registerCanvasEvents();
    await socket.connect();
    this.registerSocketEvents();
    this.joinGame();
    this.renderLoop();
  }

  prepareCanvas() {
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.style.background = "#02150b";

    this.canvas.style.display = "block";
    document.body.appendChild(this.canvas);

    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.renderer.buildStaticBackground();
    };

    resize();
    window.addEventListener("resize", resize);
  }

  async fetchCurrentUser() {
    const { response, data } = await fetchCurrentUserApi();

    if (!response.ok || !data.id_joueur) {
      window.location.href = "/table.html";
      return;
    }

    this.state.currentUser = data;
    this.state.phase = "auth-ok";
    this.state.banner = "Connexion à la table...";
  }

  registerCanvasEvents() {
    this.canvas.addEventListener("click", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.renderer.handleClick(x, y);
    });

    window.addEventListener("beforeunload", () => {
      socket.disconnect();
    });
  }

  registerSocketEvents() {
    registerClientEvents({
      socket,
      state: this.state,
      isHost: this.isHost,
      scheduleInitialCardsRequest: () => this.scheduleInitialCardsRequest(),
      onLocalPlayerLeft: () => this.handleLocalPlayerLeft(),
    });
  }

  handleLocalPlayerLeft() {
    this.state.banner = "Vous avez quitté la partie.";
    this.state.phase = "boot";
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 300);
  }

  joinGame() {
    if (!this.state.currentUser) return;
    socket.joinGame(
      this.state.currentUser.id_joueur,
      this.state.currentUser.pseudo,
    );
  }

  isLocalTurn() {
    const localPlayer = this.state.localPlayer;
    return (
      this.state.phase === "playing" &&
      localPlayer &&
      localPlayer.status === "playing"
    );
  }

  onHit() {
    if (!this.isLocalTurn()) return;
    socket.hit(this.state.localPlayerId);
  }

  onStand() {
    if (!this.isLocalTurn()) return;
    socket.stand(this.state.localPlayerId);
  }

  onPlayAgain() {
    if (!this.state.currentUser) return;

    this.state.resetForNewRound();

    socket.playAgain(
      this.state.currentUser.id_joueur,
      this.state.currentUser.pseudo,
    );
  }

  onLeaveGame() {
    if (!this.state.currentUser) return;
    this.state.banner = "Déconnexion de la table...";
    socket.leaveGame(this.state.currentUser.id_joueur);
  }

  renderLoop() {
    this.renderer.renderFrame(this.ctx, {
      banner: this.state.banner,
      currentUser: this.state.currentUser,
      isHost: this.isHost,
      players: this.state.players,
      dealer: this.state.dealer,
      resultsByPlayerId: this.state.resultsByPlayerId,
      localPlayerId: this.state.localPlayerId,
      phase: this.state.phase,
      canAct: this.isLocalTurn(),
      onHit: () => this.onHit(),
      onStand: () => this.onStand(),
      onLeaveGame: () => this.onLeaveGame(),
      onPlayAgain: () => this.onPlayAgain(),
    });
    requestAnimationFrame(() => this.renderLoop());
  }
}

const app = new BlackjackApp();
app.init().catch((error) => {
  console.error("Erreur de démarrage du jeu :", error);
  alert("Impossible de démarrer la table de blackjack.");
});
