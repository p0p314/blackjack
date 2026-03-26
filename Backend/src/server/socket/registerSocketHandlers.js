import {
  emitDealerStateIfNeeded,
  emitGameResultsIfReady,
  emitGameStarted,
  emitInitialCardSend,
} from "./emitters.js";
import { getHitEventName } from "./events.js";

function serializeLobbyPlayers(lobbyPlayersBySocketId) {
  return Array.from(lobbyPlayersBySocketId.values()).map((player) => ({
    id: player.playerId,
    name: player.name,
    status: player.status ?? "ready",
  }));
}

function broadcastLobby(
  io,
  lobbyPlayersBySocketId,
  eventName = null,
  playerName = null,
) {
  const players = serializeLobbyPlayers(lobbyPlayersBySocketId);

  if (eventName) {
    io.emit(eventName, {
      playerName,
      players,
    });
  }

  io.emit("LOBBY_UPDATED", { players });
}

function removeLobbyPlayer(socket, io, lobbyPlayersBySocketId) {
  const player = lobbyPlayersBySocketId.get(socket.id);

  if (!player) {
    return;
  }

  lobbyPlayersBySocketId.delete(socket.id);

  broadcastLobby(io, lobbyPlayersBySocketId, "PLAYER_LEFT", player.name);
}

export function registerSocketHandlers({
  io,
  socket,
  game,
  playersBySocketId,
  lobbyPlayersBySocketId,
}) {
  socket.on("JOIN_LOBBY", (data) => {
    if (!data?.playerId || !data?.name) {
      socket.emit("ERROR", { message: "Données de lobby invalides" });
      return;
    }

    const existingEntry = Array.from(lobbyPlayersBySocketId.values()).find(
      (player) => player.playerId === data.playerId,
    );

    if (!existingEntry) {
      lobbyPlayersBySocketId.set(socket.id, {
        socketId: socket.id,
        playerId: data.playerId,
        name: data.name,
        status: "ready",
      });

      socket.join("lobby");
      broadcastLobby(io, lobbyPlayersBySocketId, "PLAYER_JOINED", data.name);
    } else {
      // si le joueur recharge sa page, on remplace l'ancienne socket par la nouvelle
      const previousSocketId = existingEntry.socketId;
      lobbyPlayersBySocketId.delete(previousSocketId);

      lobbyPlayersBySocketId.set(socket.id, {
        socketId: socket.id,
        playerId: data.playerId,
        name: data.name,
        status: "ready",
      });

      socket.join("lobby");
      io.emit("LOBBY_UPDATED", {
        players: serializeLobbyPlayers(lobbyPlayersBySocketId),
      });
    }
  });

  socket.on("LEAVE_LOBBY", (playerId) => {
    const current = lobbyPlayersBySocketId.get(socket.id);

    if (!current) {
      const entry = Array.from(lobbyPlayersBySocketId.entries()).find(
        ([, value]) => value.playerId === playerId,
      );

      if (!entry) return;

      const [socketId, player] = entry;
      lobbyPlayersBySocketId.delete(socketId);

      broadcastLobby(io, lobbyPlayersBySocketId, "PLAYER_LEFT", player.name);
      return;
    }

    lobbyPlayersBySocketId.delete(socket.id);
    broadcastLobby(io, lobbyPlayersBySocketId, "PLAYER_LEFT", current.name);
  });

  socket.on("JOIN_GAME", (playerId, name) => {
    const result = game.addPlayer(playerId, name);

    if (!result.success) {
      console.log(
        `Le joueur ${playerId} est déjà dans la partie ou la table est pleine`,
      );
      socket.emit("JOIN_GAME_FAILED", { message: result.message });
      return;
    }

    playersBySocketId.set(socket.id, {
      socketId: socket.id,
      playerId,
      name,
    });

    console.log(`Le joueur ${playerId} a rejoint la partie`);
    socket.emit("JOIN_GAME_SUCCESS", { playerId });
  });

  socket.on("START_GAME", () => {
    // Cas 1 : démarrage depuis le lobby -> on prévient juste les clients de rediriger
    if (game.players.length === 0) {
      const lobbyPlayers = serializeLobbyPlayers(lobbyPlayersBySocketId);

      if (lobbyPlayers.length === 0) {
        return;
      }

      io.emit("GAME_STARTING", {
        players: lobbyPlayers.map((player) => ({
          id: player.id,
          name: player.name,
        })),
      });

      return;
    }

    // Cas 2 : démarrage réel depuis la page de jeu
    game.start();
    console.log("Game started");
    emitGameStarted(io, game);
  });

  socket.on("PLAY_AGAIN", (playerId, name) => {
    game.restart(playerId, name);
    console.log(`Player ${playerId} wants to play again: RESET`);
    emitGameStarted(io, game);
  });

  socket.on("WAITING_INITIAL_CARDS", () => {
    console.log("Le client attend les cartes initiales");
    game.dealInitialCards();
    emitInitialCardSend(io, game);
  });

  socket.on("INITIAL_CARDS_RECEIVED", () => {});

  socket.on("HIT", (playerId) => {
    console.log(playerId, "demande une carte");
    const result = game.playerHit(playerId);

    if (!result) {
      return;
    }

    const event = getHitEventName(result.status);
    io.emit(event, result);

    emitDealerStateIfNeeded(io, game);
    emitGameResultsIfReady(io, game);
  });

  socket.on("STAND", (playerId) => {
    const result = game.playerStand(playerId);

    if (!result) {
      return;
    }

    io.emit("PLAYER_STOOD", result);

    emitDealerStateIfNeeded(io, game);
    emitGameResultsIfReady(io, game);
  });

  socket.on("DEALER_PLAY", () => {
    game.dealerPlay();
    console.log("Le dealer joue");
  });

  socket.on("disconnect", (reason) => {
    removeLobbyPlayer(socket, io, lobbyPlayersBySocketId);

    const player = playersBySocketId.get(socket.id);
    playersBySocketId.delete(socket.id);

    if (!player) {
      console.log("Socket déconnecté sans joueur associé :", reason);
      return;
    }

    console.log(`Un joueur (${player.name}) s'est déconnecté :`, reason);
    game.removePlayer(player.playerId);
  });
}
