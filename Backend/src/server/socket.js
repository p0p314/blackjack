import { registerSocketHandlers } from "./socket/registerSocketHandlers.js";

export default function initSocket(io, game) {
  const playersBySocketId = new Map();
  const lobbyPlayersBySocketId = new Map();
  const gameStartState = {
    pendingPlayers: null,
  };

  io.on("connect", (socket) => {
    console.log("Un joueur connecté :", socket.id);
    console.log("[socket][emit] connected");
    socket.emit("connected");

    registerSocketHandlers({
      io,
      socket,
      game,
      playersBySocketId,
      lobbyPlayersBySocketId,
      gameStartState,
    });
  });
}
