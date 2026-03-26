import {
  emitDealerStateIfNeeded,
  emitGameResultsIfReady,
  emitGameStarted,
  emitInitialCardSend,
} from "./emitters.js";
import { getHitEventName } from "./events.js";
import { Action, Partie } from "../../model/index.js";

function formatPayload(payload) {
  try {
    const serialized = JSON.stringify(payload);
    return serialized.length > 500
      ? `${serialized.slice(0, 500)}...`
      : serialized;
  } catch (error) {
    return String(payload);
  }
}

function logOn(eventName, payload) {
  console.log(`[socket][on] ${eventName}`, formatPayload(payload));
}

function logEmit(eventName, payload) {
  console.log(`[socket][emit] ${eventName}`, formatPayload(payload));
}

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
    const payload = { playerName, players };
    logEmit(eventName, payload);
    io.emit(eventName, payload);
  }

  logEmit("LOBBY_UPDATED", { players });
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
  gameStartState,
}) {
  const resetRoundPersistenceState = () => {
    gameStartState.playerGameIds.clear();
    gameStartState.roundInitialized = false;
    gameStartState.resultsPersisted = false;
  };

  const initializeRoundPersistence = async () => {
    if (gameStartState.roundInitialized || game.players.length === 0) {
      return;
    }

    const createdGames = await Promise.all(
      game.players.map((player) =>
        Partie.create({
          id_joueur: player.id,
          mise: 0,
          resultat: "Égalité",
          gain_perte: 0,
          score_final_joueur: null,
          date_partie: new Date(),
        }),
      ),
    );

    createdGames.forEach((partie, index) => {
      const player = game.players[index];
      if (!player) return;
      gameStartState.playerGameIds.set(player.id, partie.id_partie);
    });

    gameStartState.roundInitialized = true;
  };

  const persistPlayerAction = async (playerId, typeAction, value) => {
    const idPartie = gameStartState.playerGameIds.get(playerId);

    if (!idPartie) {
      return;
    }

    await Action.create({
      id_partie: idPartie,
      type_action: typeAction,
      valeur_main: value,
    });
  };

  const persistRoundResults = async (results) => {
    if (!Array.isArray(results) || gameStartState.resultsPersisted) {
      return;
    }

    const statusMap = {
      win: "Victoire",
      lost: "Défaite",
      draw: "Égalité",
      bust: "Bust",
    };

    await Promise.all(
      results.map((result) => {
        const idPartie = gameStartState.playerGameIds.get(result.player);
        if (!idPartie) {
          return Promise.resolve();
        }

        return Partie.update(
          {
            resultat: statusMap[result.status] ?? "Égalité",
            gain_perte: 0,
            score_final_joueur: result.score ?? null,
          },
          {
            where: {
              id_partie: idPartie,
            },
          },
        );
      }),
    );

    gameStartState.resultsPersisted = true;
  };

  const finalizeTurnAndPersist = async () => {
    emitDealerStateIfNeeded(io, game);
    const roundResults = emitGameResultsIfReady(io, game);
    await persistRoundResults(roundResults);
  };
  const allPendingJoined = () => {
    const pending = gameStartState.pendingPlayers;

    if (!pending || pending.length === 0) {
      return false;
    }

    const expectedIds = new Set(pending.map((p) => String(p.id)));

    return Array.from(expectedIds).every((id) =>
      game.players.some((player) => String(player.id) === id),
    );
  };

  const startGameIfReady = () => {
    if (allPendingJoined()) {
      resetRoundPersistenceState();
      game.start();
      emitGameStarted(io, game);
      gameStartState.pendingPlayers = null;
      return true;
    }

    return false;
  };
  socket.on("JOIN_LOBBY", (data) => {
    logOn("JOIN_LOBBY", data);
    if (!data?.playerId || !data?.name) {
      const payload = { message: "Données de lobby invalides" };
      logEmit("ERROR", payload);
      socket.emit("ERROR", payload);
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
      const payload = {
        players: serializeLobbyPlayers(lobbyPlayersBySocketId),
      };
      logEmit("LOBBY_UPDATED", payload);
      io.emit("LOBBY_UPDATED", payload);
    }
  });

  socket.on("LEAVE_LOBBY", (playerId) => {
    logOn("LEAVE_LOBBY", { playerId });
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
    logOn("JOIN_GAME", { playerId, name });
    const result = game.addPlayer(playerId, name);

    if (!result.success) {
      console.log(
        `Le joueur ${playerId} est déjà dans la partie ou la table est pleine`,
      );
      const payload = { message: result.message };
      logEmit("JOIN_GAME_FAILED", payload);
      socket.emit("JOIN_GAME_FAILED", payload);
      return;
    }

    playersBySocketId.set(socket.id, {
      socketId: socket.id,
      playerId,
      name,
    });

    console.log(`Le joueur ${playerId} a rejoint la partie`);
    const payload = { playerId };
    logEmit("JOIN_GAME_SUCCESS", payload);
    socket.emit("JOIN_GAME_SUCCESS", payload);

    startGameIfReady();
  });

  socket.on("START_GAME", () => {
    logOn("START_GAME");

    // Si les cartes initiales ont déjà été distribuées, on ignore pour éviter un reset inopiné
    if (game.initialDealDone) {
      console.log("START_GAME ignoré : deal initial déjà fait");
      return;
    }

    // Cas 1 : démarrage depuis le lobby -> on enregistre les joueurs attendus et on redirige
    if (game.players.length === 0) {
      const lobbyPlayers = serializeLobbyPlayers(lobbyPlayersBySocketId);

      if (lobbyPlayers.length === 0) {
        return;
      }

      gameStartState.pendingPlayers = lobbyPlayers.map((player) => ({
        id: String(player.id),
        name: player.name,
      }));

      const payload = {
        players: lobbyPlayers.map((player) => ({
          id: player.id,
          name: player.name,
        })),
      };

      logEmit("GAME_STARTING", payload);
      io.emit("GAME_STARTING", payload);

      lobbyPlayersBySocketId.clear();
      return;
    }

    // Cas 2 : démarrage réel depuis la page de jeu
    if (gameStartState.pendingPlayers && startGameIfReady()) {
      return;
    }
    resetRoundPersistenceState();

    game.start();
    emitGameStarted(io, game);
  });

  socket.on("PLAY_AGAIN", (playerId, name) => {
    logOn("PLAY_AGAIN", { playerId, name });
    resetRoundPersistenceState();
    game.restart(playerId, name);
    console.log(`Player ${playerId} wants to play again: RESET`);
    emitGameStarted(io, game);
  });

  socket.on("LEAVE_GAME", (playerId) => {
    logOn("LEAVE_GAME", { playerId });

    removeLobbyPlayer(socket, io, lobbyPlayersBySocketId);

    const bySocket = playersBySocketId.get(socket.id);
    const targetId = playerId ?? bySocket?.playerId;
    const targetName = bySocket?.name;

    if (targetId != null) {
      game.removePlayer(targetId);
      playersBySocketId.delete(socket.id);

      const payload = { playerId: targetId, name: targetName };
      logEmit("PLAYER_LEFT_GAME", payload);
      io.emit("PLAYER_LEFT_GAME", payload);

      if (game.players.length === 0) {
        resetRoundPersistenceState();
        game.start();
        gameStartState.pendingPlayers = null;
        console.log("Table réinitialisée : plus aucun joueur");
      }
    }

    socket.disconnect(true);
  });

  socket.on("WAITING_INITIAL_CARDS", async () => {
    logOn("WAITING_INITIAL_CARDS");
    console.log("Le client attend les cartes initiales");
    game.dealInitialCards();
    await initializeRoundPersistence();
    emitInitialCardSend(io, game);
    await finalizeTurnAndPersist();
  });

  socket.on("INITIAL_CARDS_RECEIVED", () => {
    logOn("INITIAL_CARDS_RECEIVED");
  });

  socket.on("HIT", async (playerId) => {
    logOn("HIT", { playerId });
    console.log(playerId, "demande une carte");
    const result = game.playerHit(playerId);

    if (!result) {
      return;
    }

    const event = getHitEventName(result.status);
    logEmit(event, result);
    io.emit(event, result);

    await persistPlayerAction(playerId, "Tirer", result.score);
    await finalizeTurnAndPersist();
  });

  socket.on("STAND", async (playerId) => {
    logOn("STAND", { playerId });
    const result = game.playerStand(playerId);

    if (!result) {
      return;
    }

    logEmit("PLAYER_STOOD", result);
    io.emit("PLAYER_STOOD", result);

    await persistPlayerAction(playerId, "Rester", result.score);
    await finalizeTurnAndPersist();
  });

  socket.on("DEALER_PLAY", () => {
    logOn("DEALER_PLAY");
    game.dealerPlay();
    console.log("Le dealer joue");
  });

  socket.on("disconnect", (reason) => {
    logOn("disconnect", { reason });
    removeLobbyPlayer(socket, io, lobbyPlayersBySocketId);

    const player = playersBySocketId.get(socket.id);
    playersBySocketId.delete(socket.id);

    if (!player) {
      console.log("Socket déconnecté sans joueur associé :", reason);
      return;
    }

    console.log(`Un joueur (${player.name}) s'est déconnecté :`, reason);
    game.removePlayer(player.playerId);

    if (game.players.length === 0) {
      resetRoundPersistenceState();
      game.start();
      gameStartState.pendingPlayers = null;
      console.log("Table réinitialisée après déconnexion : plus aucun joueur");
    }
  });
}
