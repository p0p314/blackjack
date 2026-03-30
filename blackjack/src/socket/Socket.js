import { io } from "socket.io-client";

const SERVER_URL =
  (import.meta.env.VITE_SOCKET_URL || "").replace(/\/$/, "") ||
  window.location.origin;

class GameSocket {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    if (!this.socket) {
      this.socket = io(SERVER_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });
    }

    return new Promise((resolve, reject) => {
      const onConnect = () => {
        this.socket.off("connect_error", onError);
        resolve(this.socket);
      };

      const onError = (error) => {
        this.socket.off("connect", onConnect);
        reject(error);
      };

      this.socket.once("connect", onConnect);
      this.socket.once("connect_error", onError);
    });
  }

  on(eventName, callback) {
    this.socket?.on(eventName, callback);
  }

  off(eventName, callback) {
    this.socket?.off(eventName, callback);
  }

  emit(eventName, ...args) {
    this.socket?.emit(eventName, ...args);
  }

  joinGame(playerId, name) {
    this.emit("JOIN_GAME", playerId, name);
  }

  startGame() {
    this.emit("START_GAME");
  }

  waitingInitialCards() {
    this.emit("WAITING_INITIAL_CARDS");
  }

  hit(playerId) {
    this.emit("HIT", playerId);
  }

  stand(playerId) {
    this.emit("STAND", playerId);
  }

  playAgain(playerId, name) {
    this.emit("PLAY_AGAIN", playerId, name);
  }

  leaveGame(playerId) {
    this.emit("LEAVE_GAME", playerId);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socket = new GameSocket();
