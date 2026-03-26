import {
  calculateHandValue,
  normalizeSnapshot,
  resultLabel,
} from "../utils/gameHelpers.js";

class GameState {
  constructor() {
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

    this.initialCardsRequested = false;
    this.hasInitialCards = false;
  }

  get localPlayerId() {
    return this.currentUser?.id_joueur ?? null;
  }

  get localPlayer() {
    return (
      this.players.find((player) => player.id === this.localPlayerId) ?? null
    );
  }

  applyGameStarted(payload) {
    const snapshot = normalizeSnapshot(payload);
    this.players = snapshot.players;
    this.dealer = snapshot.dealer;
    this.resultsByPlayerId.clear();
    this.initialCardsRequested = false;
    this.hasInitialCards = false;
    this.phase = "starting";
    this.banner = "La partie démarre...";
  }

  applyInitialCards(payload) {
    const snapshot = normalizeSnapshot(payload);
    this.players = snapshot.players;
    this.dealer = snapshot.dealer;
    this.hasInitialCards = true;
    this.phase = "playing";
    this.banner = "À vous de jouer.";
  }

  updatePlayerFromPayload(payload) {
    if (!payload || payload.playerId == null) return;

    const player = this.players.find((entry) => entry.id === payload.playerId);
    if (!player) return;

    player.status = payload.status ?? player.status;
    player.score = payload.score ?? player.score;

    if (Array.isArray(payload.hand)) {
      player.hand = payload.hand;
    } else if (payload.card) {
      player.hand = [...player.hand, payload.card];
    }

    if (payload.playerId === this.localPlayerId) {
      const displayScore =
        typeof player.score === "number"
          ? player.score
          : calculateHandValue(player.hand);
      this.banner = `Votre main : ${displayScore}`;
    }
  }

  updateDealerFromPayload(payload) {
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
  }

  applyResults(results) {
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
  }

  removePlayer(playerId, name) {
    this.players = this.players.filter((player) => player.id !== playerId);
    this.banner = `${name ?? "Un joueur"} a quitté la partie.`;
  }

  resetForNewRound() {
    this.phase = "starting";
    this.banner = "Nouvelle manche...";
    this.initialCardsRequested = false;
    this.hasInitialCards = false;
    this.resultsByPlayerId.clear();
  }
}

export default GameState;
