import io from "socket.io-client";
import { ClientEvents, ServerEvents } from "../constant/SocketEvents.js";

const inferSocketUrl = () => {
  const fromEnv = import.meta.env.VITE_SOCKET_URL;
  if (fromEnv && typeof fromEnv === "string") {
    return fromEnv.replace(/\/$/, "");
  }
  return window.location.origin;
};

class SocketManager {
  constructor(url = inferSocketUrl()) {
    this.socket = null;
    this.url = url;
    this.listeners = new Map();
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        withCredentials: true,
        transports: ["websocket"],
      });

      this.socket.on("connect", () => {
        this.isConnected = true;
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        reject(error);
      });

      this.socket.on("disconnect", () => {
        this.isConnected = false;
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  hit(playerId) {
    this.emit(ClientEvents.HIT, { playerId });
  }

  stand(playerId) {
    this.emit(ClientEvents.STAND, { playerId });
  }

  placeBet(amount) {
    this.emit(ClientEvents.BET, { amount });
  }

  increaseBet(amount) {
    this.emit(ClientEvents.INCREASE_BET, { amount });
  }

  decreaseBet(amount) {
    this.emit(ClientEvents.DECREASE_BET, { amount });
  }

  joinGame(playerId) {
    this.emit(ClientEvents.JOIN_GAME, { playerId });
  }

  emit(event, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (!this.socket) return;

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event).push(callback);
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    this.socket.off(event, callback);
  }

  onBust(callback) {
    this.on(ServerEvents.BUST, callback);
  }

  onStand(callback) {
    this.on(ServerEvents.STAND, callback);
  }

  onBlackjack(callback) {
    this.on(ServerEvents.BLACKJACK, callback);
  }

  onWin(callback) {
    this.on(ServerEvents.WIN, callback);
  }

  onLose(callback) {
    this.on(ServerEvents.LOSE, callback);
  }

  onDraw(callback) {
    this.on(ServerEvents.DRAW, callback);
  }

  onNewCard(callback) {
    this.on(ServerEvents.NEW_CARD, callback);
  }

  onBalanceUpdated(callback) {
    this.on(ServerEvents.BALANCE_UPDATED, callback);
  }

  onBetAccepted(callback) {
    this.on(ServerEvents.BET_ACCEPTED, callback);
  }

  onGameStarted(callback) {
    this.on(ServerEvents.GAME_STARTED, callback);
  }

  onGameOver(callback) {
    this.on(ServerEvents.GAME_OVER, callback);
  }

  onError(callback) {
    this.on(ServerEvents.ERROR, callback);
  }

  joinLobby(playerId) {
    this.emit(ClientEvents.JOIN_LOBBY, { playerId });
  }

  leaveLobby(playerId) {
    this.emit(ClientEvents.LEAVE_LOBBY, { playerId });
  }

  startGame() {
    this.emit(ClientEvents.START_GAME, {});
  }

  onLobbyUpdated(callback) {
    this.on(ServerEvents.LOBBY_UPDATED, callback);
  }

  onPlayerJoined(callback) {
    this.on(ServerEvents.PLAYER_JOINED, callback);
  }

  onPlayerLeft(callback) {
    this.on(ServerEvents.PLAYER_LEFT, callback);
  }

  onGameStarting(callback) {
    this.on(ServerEvents.GAME_STARTING, callback);
  }
}

export default new SocketManager();
