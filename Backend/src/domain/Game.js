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
  constructor() {
    this.players = [];
    this.dealer = new Player(0, "Dealer");
    this.deck = new Deck();
  }

  start() {
    this.dealInitialCards();
  }

  dealInitialCards() {
    this.deck.shuffle();
    this.players.forEach((player) => {
      this.playerHit(player.id);
      this.playerHit(player.id);
    });

    this.dealer.addCard(this.deck.draw());
    this.dealer.addCard(this.deck.draw());
    this.dealer.hand[0].reveal();
  }
  addPlayer(id, name) {
    const player = new Player(id, name);
    this.players.push(player);
    return player;
  }

  removePlayer(id) {
    this.players = this.players.filter((player) => player.id !== id);
  }

  playerHit(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (player && player.status === "playing") {
      const card = this.deck.draw();
      player.addCard(card);
      console.log("Envoyer la nouvelle carte au client");

      if (isBust(player.hand)) {
        player.changeStatus("bust");
        console.log("Envoyer le résultat de bust au client");
      }

      if (isBlackjack(player.hand)) {
        player.changeStatus("blackjack");
        console.log("Envoyer le résultat de blackjack au client");
      }

      if (is21(player.hand)) {
        player.changeStatus("stood");
        console.log("Envoyer le résultat de 21 au client");
      }
    }
  }

  playerStand(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (player && player.status === "playing") {
      player.changeStatus("stood");
      console.log("Envoyer le résultat de stand au client");
    }
  }

  dealerPlay() {
    if (this.players.every((player) => player.status !== "playing")) {
      this.dealer.changeStatus("stood");
      console.log("Envoyer le résultat de stand du dealer au client");
      return;
    }
    while (shouldDealerHit(this.dealer.hand)) {
      this.dealer.addCard(this.deck.draw());
      console.log("Envoyer la nouvelle carte du dealer au client");
      if (isBust(this.dealer.hand)) {
        this.dealer.changeStatus("bust");
        console.log("Envoyer le résultat de bust du dealer au client");
        break;
      }
    }
    if (this.dealer.status !== "bust") {
      this.dealer.changeStatus("stood");
      console.log("Envoyer le résultat de stand du dealer au client");
    }
  }

  calulateResults() {
    this.players.forEach((player) => {
      if (player.status === "bust") {
        console.log("[FIN] Envoyer le résultat de lose au client");
      } else if (this.dealer.status === "bust") {
        console.log("[FIN] Envoyer le résultat de win au client");
      } else {
        if (
          calculateHandValue(player.hand) > calculateHandValue(this.dealer.hand)
        ) {
          console.log("[FIN] Envoyer le résultat de win au client");
        } else if (
          calculateHandValue(player.hand) < calculateHandValue(this.dealer.hand)
        ) {
          console.log("[FIN] Envoyer le résultat de lost au client");
        } else {
          console.log("[FIN] Envoyer le résultat de draw au client");
        }
      }
    });
  }
}
