import Card from "./Card.js";
import Deck from "./Deck.js";
import Player from "./Player.js";
import {
  calculateHandValue,
  is21,
  isBlackjack,
  isBust,
  shouldDealerHit,
} from "./Rules.js";

export default class Game {
  constructor(maxPlayers = 4) {
    this.maxPlayers = maxPlayers;
    this.players = [];
    this.dealer = new Player(0, "Dealer");
    this.deck = new Deck();
    this.initialDealDone = false;
  }

  serializePlayer(player) {
    return {
      id: player.id,
      name: player.name,
      status: player.status,
      hand: [...player.hand],
      score: calculateHandValue(player.hand),
    };
  }

  serializeDealer() {
    return {
      id: 0,
      name: "Dealer",
      status: this.dealer.status,
      hand: [...this.dealer.hand],
      score: calculateHandValue(
        this.dealer.hand.filter((card) => card.isRevealed),
      ),
    };
  }

  getSnapshot() {
    return {
      players: this.players.map((player) => this.serializePlayer(player)),
      dealer: this.serializeDealer(),
    };
  }

  addPlayer(id, name) {
    const playerExists = this.players.find((player) => player.id === id);
    if (playerExists) {
      return { success: false, message: "Le joueur est déjà dans la partie" };
    }

    if (this.players.length >= this.maxPlayers) {
      return { success: false, message: "La table est pleine" };
    }

    const player = new Player(id, name);
    this.players.push(player);

    return { success: true, player };
  }

  removePlayer(id) {
    this.players = this.players.filter((player) => player.id !== id);
  }

  restart(playerId, name) {
    const alreadySeated = this.players.some((player) => player.id === playerId);

    if (!alreadySeated) {
      this.addPlayer(playerId, name);
    }

    this.start();
  }

  start() {
    const existingPlayers = this.players.map((player) => ({
      id: player.id,
      name: player.name,
    }));

    this.players = existingPlayers.map(
      (player) => new Player(player.id, player.name),
    );

    this.dealer = new Player(0, "Dealer");
    this.deck = new Deck();
    this.initialDealDone = false;
  }

  dealInitialCards() {
    if (this.initialDealDone) {
      return this.getSnapshot();
    }

    this.players.forEach((player) => {
      this.playerHit(player.id);
      this.playerHit(player.id);
    });

    this.dealer.addCard(this.deck.draw());
    this.dealer.addCard(this.deck.draw());

    if (this.dealer.hand[0]) {
      this.dealer.hand[0].reveal();
    }

    this.initialDealDone = true;
    return this.getSnapshot();
  }

  playerHit(playerId) {
    const player = this.players.find((entry) => entry.id === playerId);

    if (!player || player.status !== "playing") {
      return null;
    }

    const card = this.deck.draw();

    if (card.isAs()) {
      const currentScore = calculateHandValue(player.hand);
      card.value = currentScore + 11 > 21 ? 1 : 11;
    }

    player.addCard(card);

    const score = calculateHandValue(player.hand);

    if (isBust(player.hand)) {
      player.changeStatus("bust");
    } else if (isBlackjack(player.hand)) {
      player.changeStatus("blackjack");
    } else if (is21(player.hand)) {
      player.changeStatus("stood");
    }

    return {
      playerId: player.id,
      status: player.status,
      score,
      card,
      hand: [...player.hand],
    };
  }

  playerStand(playerId) {
    const player = this.players.find((entry) => entry.id === playerId);

    if (!player || player.status !== "playing") {
      return null;
    }

    player.changeStatus("stood");

    return {
      playerId: player.id,
      status: "stood",
      score: calculateHandValue(player.hand),
      hand: [...player.hand],
    };
  }

  applyAs(playerId, cardSuit, value) {
    const player = this.players.find((entry) => entry.id === playerId);
    if (!player) return null;

    player.addCard(new Card(cardSuit, "A", value));
    return this.serializePlayer(player);
  }

  dealerPlay() {
    let lastCard = null;

    while (shouldDealerHit(this.dealer.hand)) {
      this.dealer.hand.forEach((card) => card.reveal());
      const card = this.deck.draw();

      if (card.isAs()) {
        const currentScore = calculateHandValue(this.dealer.hand);
        card.value = currentScore + 11 > 21 ? 1 : 11;
      }
      card.reveal();
      this.dealer.addCard(card);
      lastCard = card;

      if (isBust(this.dealer.hand)) {
        this.dealer.changeStatus("bust");
        return {
          status: "bust",
          score: calculateHandValue(this.dealer.hand),
          card: lastCard,
          hand: [...this.dealer.hand],
        };
      }
    }

    this.dealer.changeStatus("stood");

    return {
      status: "stood",
      score: calculateHandValue(this.dealer.hand),
      card: lastCard,
      hand: [...this.dealer.hand],
    };
  }

  dealerCanPlay() {
    return (
      this.players.length > 0 &&
      this.dealer.status === "playing" &&
      !this.players.some((player) => player.status === "playing")
    );
  }

  calulateResults() {
    if (this.players.some((player) => player.status === "playing")) {
      return null;
    }

    const dealerScore = calculateHandValue(this.dealer.hand);
    const results = [];

    this.players.forEach((player) => {
      const playerScore = calculateHandValue(player.hand);

      if (player.status === "bust") {
        player.changeStatus("lost");
        results.push({
          player: player.id,
          status: "lost",
          score: playerScore,
        });
        return;
      }

      if (this.dealer.status === "bust") {
        player.changeStatus("win");
        results.push({
          player: player.id,
          status: "win",
          score: playerScore,
        });
        return;
      }

      if (playerScore > dealerScore) {
        player.changeStatus("win");
        results.push({
          player: player.id,
          status: "win",
          score: playerScore,
        });
      } else if (playerScore < dealerScore) {
        player.changeStatus("lost");
        results.push({
          player: player.id,
          status: "lost",
          score: playerScore,
        });
      } else {
        player.changeStatus("draw");
        results.push({
          player: player.id,
          status: "draw",
          score: playerScore,
        });
      }
    });

    return results;
  }
}
