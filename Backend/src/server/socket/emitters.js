import { GAME_RESULT_EVENTS } from "./events.js";

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

function logEmit(eventName, payload) {
  console.log(`[socket][emit] ${eventName}`, formatPayload(payload));
}

export function emitGameStarted(io, game) {
  const payload = game.getSnapshot();
  logEmit("GAME_STARTED", payload);
  io.emit("GAME_STARTED", payload);
}

export function emitDealerStateIfNeeded(io, game) {
  if (!game.dealerCanPlay()) {
    return;
  }

  const dealerResult = game.dealerPlay();

  if (dealerResult.status === "bust") {
    logEmit("DEALER_BUST", dealerResult);
    io.emit("DEALER_BUST", dealerResult);
  } else if (dealerResult.status === "stood") {
    logEmit("DEALER_STOOD", dealerResult);
    io.emit("DEALER_STOOD", dealerResult);
  }
}

export function emitInitialCardSend(io, game) {
  const payload = game.getSnapshot();
  logEmit("INITIAL_CARDS", payload);
  io.emit("INITIAL_CARDS", payload);
}

export function emitGameResultsIfReady(io, game) {
  const resultGame = game.calulateResults();

  if (resultGame == null) {
    return;
  }

  Object.entries(GAME_RESULT_EVENTS).forEach(([status, eventName]) => {
    if (resultGame.some((player) => player.status === status)) {
      logEmit(eventName, resultGame);
      io.emit(eventName, resultGame);
    }
  });
}
