import e from "express";
import Game from "./src/domain/Game.js";
import {
  calculateHandValue,
  determineWinner,
  isBlackjack,
  isBust,
  shouldDealerHit,
} from "./src/domain/Rules.js";

const game = new Game();

// ajouter un joueur

game.addPlayer("p1", "Alice");

// lancer la partie
game.start();
// afficher résultat

game.playerHit("p1");
game.playerHit("p1");
game.playerHit("p1");
game.playerStand("p1");
game.dealerPlay();

game.calulateResults();
