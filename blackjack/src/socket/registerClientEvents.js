export function registerClientEvents({
  socket,
  state,
  isHost,
  scheduleInitialCardsRequest,
  onLocalPlayerLeft,
}) {
  let startScheduled = false;

  socket.on("connected", () => {
    state.phase = "socket-connected";
    state.banner = "Socket connecté.";
  });

  socket.on("JOIN_GAME_SUCCESS", () => {
    state.phase = "joined";
    state.banner = isHost
      ? "Table prête. Attente des autres joueurs..."
      : "Rejoint la table. Attente du host...";

    if (isHost && !startScheduled) {
      startScheduled = true;
      setTimeout(() => {
        socket.startGame();
      }, 1200);
    }
  });

  socket.on("JOIN_GAME_FAILED", (payload) => {
    state.phase = "join-failed";
    state.banner = payload?.message ?? "Impossible de rejoindre la table.";
  });

  socket.on("GAME_STARTED", (payload) => {
    state.applyGameStarted(payload);
    scheduleInitialCardsRequest();
  });

  socket.on("INITIAL_CARDS", (payload) => {
    state.applyInitialCards(payload);
  });

  const handlePlayerEvent = (payload) => state.updatePlayerFromPayload(payload);

  socket.on("CARD_RECEIVED", handlePlayerEvent);
  socket.on("PLAYER_BUST", handlePlayerEvent);
  socket.on("PLAYER_BLACKJACK", handlePlayerEvent);
  socket.on("PLAYER_STOOD", handlePlayerEvent);

  const handleDealerEvent = (payload) => state.updateDealerFromPayload(payload);

  socket.on("DEALER_BUST", handleDealerEvent);
  socket.on("DEALER_STOOD", handleDealerEvent);

  const handleResults = (results) => state.applyResults(results);

  socket.on("PLAYER_WIN", handleResults);
  socket.on("PLAYER_LOST", handleResults);
  socket.on("PLAYER_DRAW", handleResults);

  socket.on("PLAYER_LEFT_GAME", (payload) => {
    if (!payload || payload.playerId == null) return;

    if (payload.playerId === state.localPlayerId) {
      onLocalPlayerLeft();
      return;
    }

    state.removePlayer(payload.playerId, payload.name);
  });
}
