// gameManager.js
import Game from "../domain/Game.js";

const games = new Map();

export function createGame(id) {
  const game = new Game();
  games.set(id, game);
  return game;
}

export function getGame(id) {
  return games.get(id);
}

export function deleteGame(id) {
  games.delete(id);
}
