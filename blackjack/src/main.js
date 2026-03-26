import {
  loadAssets,
  getAsset,
  getCard,
  getBackCards,
} from "./Manager/AssetsManager.js";
import ImageView from "./Manager/ImageView.js";
import ButtonView from "./Manager/ButtonView.js";
import TextView from "./Manager/TextView.js";
import Scene from "./Scene.js";
import { socket } from "./Socket.js";

const API_BASE_URL = "http://localhost:3000";
const CARD_WIDTH = 90;
const CARD_HEIGHT = 135;
// spacing >= CARD_WIDTH to avoid overlap between cards
const CARD_SPACING = CARD_WIDTH + 10;
const MAX_PLAYERS = 4;

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function calculateHandValue(cards = []) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    total += safeNumber(card.value);
    if (card.rank === "A") {
      aces += 1;
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function safeJson(response) {
  return response.text().then((text) => {
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  });
}

function normalizeSnapshot(payload) {
  const players = Array.isArray(payload?.players)
    ? payload.players.map((player) => ({
        ...player,
        hand: Array.isArray(player.hand) ? player.hand : [],
        score:
          typeof player.score === "number"
            ? player.score
            : calculateHandValue(player.hand),
      }))
    : [];

  const dealerSource = payload?.dealer ?? { hand: [] };

  const dealer = Array.isArray(dealerSource)
    ? {
        id: 0,
        name: "Dealer",
        status: "playing",
        hand: dealerSource,
        score: calculateHandValue(dealerSource),
      }
    : {
        id: 0,
        name: "Dealer",
        status: dealerSource.status ?? "playing",
        hand: Array.isArray(dealerSource.hand) ? dealerSource.hand : [],
        score:
          typeof dealerSource.score === "number"
            ? dealerSource.score
            : calculateHandValue(dealerSource.hand ?? []),
      };

  return { players, dealer };
}

function resultLabel(status) {
  switch (status) {
    case "win":
      return "Victoire";
    case "lost":
      return "Défaite";
    case "draw":
      return "Égalité";
    case "bust":
      return "Bust";
    case "blackjack":
      return "Blackjack";
    case "stood":
      return "Reste";
    case "playing":
      return "En jeu";
    default:
      return status ?? "";
  }
}

function cardImage(card) {
  if (!card) {
    return getBackCards("BLACK");
  }

  if (card.isRevealed === false) {
    return getBackCards("BLACK");
  }

  return getCard(card.alias) ?? getBackCards("BLACK");
}

class BlackjackApp {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    this.backgroundScene = new Scene();
    this.gameScene = new Scene();

    this.currentUser = null;
    this.players = [];
    this.dealer = {
      id: 0,
      name: "Dealer",
      status: "playing",
      hand: [],
      score: 0,
    };

    this.phase = "boot";
    this.banner = "Chargement...";
    this.resultsByPlayerId = new Map();

    this.isHost = (() => {
      const hostParam = new URLSearchParams(window.location.search).get("host");
      if (hostParam === null) return true;
      return hostParam === "1";
    })();

    this.startScheduled = false;
    this.initialCardsRequested = false;
    this.hasInitialCards = false;

    this.buttons = {
      hit: null,
      stand: null,
      playAgain: null,
      leave: null,
    };
  }

  get localPlayerId() {
    return this.currentUser?.id_joueur ?? null;
  }

  get localPlayer() {
    return (
      this.players.find((player) => player.id === this.localPlayerId) ?? null
    );
  }

  async init() {
    this.prepareCanvas();
    await loadAssets();
    await this.fetchCurrentUser();
    this.buildStaticBackground();
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
      this.buildStaticBackground();
    };

    resize();
    window.addEventListener("resize", resize);
  }

  async fetchCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });

    const data = await safeJson(response);

    if (!response.ok || !data.id_joueur) {
      window.location.href = "/home.html";
      return;
    }

    this.currentUser = data;
    this.phase = "auth-ok";
    this.banner = "Connexion à la table...";
  }

  buildStaticBackground() {
    this.backgroundScene.clear();

    this.backgroundScene.add(
      new ImageView(
        getAsset("FOND"),
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      ),
    );

    this.backgroundScene.add(
      new ImageView(
        getAsset("TAPIS"),
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      ),
    );
  }

  registerCanvasEvents() {
    this.canvas.addEventListener("click", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.gameScene.handleClick(x, y);
    });

    window.addEventListener("beforeunload", () => {
      socket.disconnect();
    });
  }

  registerSocketEvents() {
    socket.on("connected", () => {
      this.phase = "socket-connected";
      this.banner = "Socket connecté.";
    });

    socket.on("JOIN_GAME_SUCCESS", () => {
      this.phase = "joined";
      this.banner = this.isHost
        ? "Table prête. Attente des autres joueurs..."
        : "Rejoint la table. Attente du host...";

      if (this.isHost && !this.startScheduled) {
        this.startScheduled = true;
        setTimeout(() => {
          socket.startGame();
        }, 1200);
      }
    });

    socket.on("JOIN_GAME_FAILED", (payload) => {
      this.phase = "join-failed";
      this.banner = payload?.message ?? "Impossible de rejoindre la table.";
    });

    socket.on("GAME_STARTED", (payload) => {
      const snapshot = normalizeSnapshot(payload);
      this.players = snapshot.players;
      this.dealer = snapshot.dealer;
      this.resultsByPlayerId.clear();
      this.phase = "starting";
      this.banner = "La partie démarre...";

      if (!this.initialCardsRequested) {
        this.initialCardsRequested = true;

        if (this.isHost) {
          setTimeout(() => {
            socket.waitingInitialCards();
          }, 300);
        } else {
          setTimeout(() => {
            if (!this.hasInitialCards) {
              socket.waitingInitialCards();
            }
          }, 1800);
        }
      }
    });

    socket.on("INITIAL_CARDS", (payload) => {
      const snapshot = normalizeSnapshot(payload);
      this.players = snapshot.players;
      this.dealer = snapshot.dealer;
      this.hasInitialCards = true;
      this.phase = "playing";
      this.banner = "À vous de jouer.";
    });

    const handlePlayerEvent = (payload) => {
      if (!payload || payload.playerId == null) return;

      const player = this.players.find(
        (entry) => entry.id === payload.playerId,
      );
      if (!player) return;

      player.status = payload.status ?? player.status;
      player.score = payload.score ?? player.score;

      if (Array.isArray(payload.hand)) {
        player.hand = payload.hand;
      } else if (payload.card) {
        player.hand = [...player.hand, payload.card];
      }

      if (payload.playerId === this.localPlayerId) {
        this.banner = `Votre main : ${payload.score}`;
      }
    };

    socket.on("CARD_RECEIVED", handlePlayerEvent);
    socket.on("PLAYER_BUST", handlePlayerEvent);
    socket.on("PLAYER_BLACKJACK", handlePlayerEvent);
    socket.on("PLAYER_STOOD", handlePlayerEvent);

    const handleDealerEvent = (payload) => {
      if (!payload) return;

      this.dealer.status = payload.status ?? this.dealer.status;
      this.dealer.score = payload.score ?? this.dealer.score;

      if (Array.isArray(payload.hand)) {
        this.dealer.hand = payload.hand;
      } else if (payload.card) {
        this.dealer.hand = [...this.dealer.hand, payload.card];
      }

      this.banner =
        this.dealer.status === "bust"
          ? "Le dealer a bust."
          : "Le dealer a terminé son tour.";
    };

    socket.on("DEALER_BUST", handleDealerEvent);
    socket.on("DEALER_STOOD", handleDealerEvent);

    const handleResults = (results) => {
      if (!Array.isArray(results)) return;

      results.forEach((entry) => {
        this.resultsByPlayerId.set(entry.player, entry.status);

        const player = this.players.find((p) => p.id === entry.player);
        if (player) {
          player.status = entry.status;
          player.score = entry.score ?? player.score;
        }
      });

      const localResult = results.find(
        (entry) => entry.player === this.localPlayerId,
      );
      this.phase = "finished";

      if (localResult) {
        const label = resultLabel(localResult.status);
        this.banner = `Résultat : ${label}`;
      } else {
        this.banner = "Manche terminée.";
      }
    };

    socket.on("PLAYER_WIN", handleResults);
    socket.on("PLAYER_LOST", handleResults);
    socket.on("PLAYER_DRAW", handleResults);

    socket.on("PLAYER_LEFT_GAME", (payload) => {
      if (!payload || payload.playerId == null) return;

      if (payload.playerId === this.localPlayerId) {
        this.banner = "Vous avez quitté la partie.";
        this.phase = "boot";
        setTimeout(() => {
          window.location.href = "/home.html";
        }, 300);
        return;
      }

      this.players = this.players.filter(
        (player) => player.id !== payload.playerId,
      );
      this.banner = `${payload.name ?? "Un joueur"} a quitté la partie.`;
    });
  }

  joinGame() {
    if (!this.currentUser) return;
    socket.joinGame(this.currentUser.id_joueur, this.currentUser.pseudo);
  }

  isLocalTurn() {
    const localPlayer = this.localPlayer;
    return (
      this.phase === "playing" &&
      localPlayer &&
      localPlayer.status === "playing"
    );
  }

  onHit() {
    if (!this.isLocalTurn()) return;
    socket.hit(this.localPlayerId);
  }

  onStand() {
    if (!this.isLocalTurn()) return;
    socket.stand(this.localPlayerId);
  }

  onPlayAgain() {
    if (!this.currentUser) return;

    this.phase = "starting";
    this.banner = "Nouvelle manche...";
    this.initialCardsRequested = false;
    this.hasInitialCards = false;
    this.resultsByPlayerId.clear();

    socket.playAgain(this.currentUser.id_joueur, this.currentUser.pseudo);
  }

  onLeaveGame() {
    if (!this.currentUser) return;
    this.banner = "Déconnexion de la table...";
    socket.leaveGame(this.currentUser.id_joueur);
  }

  orderedPlayersForRender() {
    const local = this.players.find(
      (player) => player.id === this.localPlayerId,
    );
    const others = this.players.filter(
      (player) => player.id !== this.localPlayerId,
    );
    return [local, ...others].filter(Boolean).slice(0, MAX_PLAYERS);
  }

  seatLayouts() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    return [
      { x: w / 2, y: h * 0.77, align: "center" },
      { x: w * 0.2, y: h * 0.58, align: "left" },
      { x: w * 0.8, y: h * 0.58, align: "right" },
      { x: w / 2, y: h * 0.46, align: "center" },
    ];
  }

  handStartX(centerX, cardCount) {
    const totalWidth = CARD_WIDTH + Math.max(0, cardCount - 1) * CARD_SPACING;
    return centerX - totalWidth / 2;
  }

  addHandToScene(cards, centerX, y) {
    const startX = this.handStartX(centerX, cards.length);

    cards.forEach((card, index) => {
      this.gameScene.add(
        new ImageView(
          cardImage(card),
          startX + index * CARD_SPACING,
          y,
          CARD_WIDTH,
          CARD_HEIGHT,
        ),
      );
    });
  }

  rebuildScene() {
    this.gameScene.clear();

    const w = this.canvas.width;
    const h = this.canvas.height;

    this.gameScene.add(
      new TextView({
        text: "BLACKJACK",
        x: 30,
        y: 26,
        color: "#ffffff",
        font: "700 34px Arial",
      }),
    );

    this.gameScene.add(
      new TextView({
        text: this.currentUser
          ? `${this.currentUser.pseudo}${this.isHost ? " • Host" : ""}`
          : "",
        x: w - 30,
        y: 28,
        color: "#ffffff",
        font: "600 22px Arial",
        align: "right",
      }),
    );

    this.gameScene.add(
      new TextView({
        text: this.banner,
        x: w / 2,
        y: 42,
        color: "#f7f7f7",
        font: "600 24px Arial",
        align: "center",
      }),
    );

    this.gameScene.add(
      new TextView({
        text: `Joueurs connectés : ${this.players.length}`,
        x: w / 2,
        y: 76,
        color: "rgba(255,255,255,0.85)",
        font: "18px Arial",
        align: "center",
      }),
    );

    this.addHandToScene(this.dealer.hand, w / 2, 120);

    this.gameScene.add(
      new TextView({
        text: `Dealer • ${resultLabel(this.dealer.status)} • ${this.dealer.score}`,
        x: w / 2,
        y: 104,
        color: "#ffffff",
        font: "600 22px Arial",
        align: "center",
      }),
    );

    const seats = this.seatLayouts();
    const orderedPlayers = this.orderedPlayersForRender();

    orderedPlayers.forEach((player, index) => {
      const seat = seats[index];
      const isLocal = player.id === this.localPlayerId;
      const result = this.resultsByPlayerId.get(player.id);

      this.addHandToScene(player.hand, seat.x, seat.y);

      const titleColor = isLocal ? "#ffd54a" : "#ffffff";
      const subtitleColor = result ? "#9effa8" : "rgba(255,255,255,0.82)";
      const score =
        typeof player.score === "number"
          ? player.score
          : calculateHandValue(player.hand);

      this.gameScene.add(
        new TextView({
          text: `${player.name}${isLocal ? " (vous)" : ""}`,
          x: seat.x,
          y: seat.y - 42,
          color: titleColor,
          font: "700 22px Arial",
          align: "center",
        }),
      );

      this.gameScene.add(
        new TextView({
          text: `${result ? resultLabel(result) : resultLabel(player.status)} • ${score}`,
          x: seat.x,
          y: seat.y - 16,
          color: subtitleColor,
          font: "18px Arial",
          align: "center",
        }),
      );
    });

    const canAct = this.isLocalTurn();
    const showReplay = this.phase === "finished";

    this.buttons.leave = new ButtonView({
      x: w - 475,
      y: h - 92,
      width: 100,
      height: 52,
      text: "QUITTER",
      background: "#b33a3a",
      enabled: true,
      onClick: () => this.onLeaveGame(),
    });

    this.buttons.hit = new ButtonView({
      x: w - 360,
      y: h - 92,
      width: 100,
      height: 52,
      text: "TIRER",
      background: "#0d8f49",
      enabled: canAct,
      onClick: () => this.onHit(),
    });

    this.buttons.stand = new ButtonView({
      x: w - 245,
      y: h - 92,
      width: 100,
      height: 52,
      text: "RESTER",
      background: "#865f09",
      enabled: canAct,
      onClick: () => this.onStand(),
    });

    this.buttons.playAgain = new ButtonView({
      x: w - 130,
      y: h - 92,
      width: 100,
      height: 52,
      text: "REJOUER",
      background: "#325ec9",
      enabled: showReplay,
      onClick: () => this.onPlayAgain(),
    });

    this.gameScene.add(this.buttons.leave);
    this.gameScene.add(this.buttons.hit);
    this.gameScene.add(this.buttons.stand);
    this.gameScene.add(this.buttons.playAgain);
  }

  renderLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.backgroundScene.draw(this.ctx);
    this.rebuildScene();
    this.gameScene.draw(this.ctx);
    requestAnimationFrame(() => this.renderLoop());
  }
}

const app = new BlackjackApp();
app.init().catch((error) => {
  console.error("Erreur de démarrage du jeu :", error);
  alert("Impossible de démarrer la table de blackjack.");
});
