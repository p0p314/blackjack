export function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export function calculateHandValue(cards = []) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    total += safeNumber(card.value);
    if (card.rank === "A") {
      aces += 1;
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

export function normalizeSnapshot(payload) {
  const players = Array.isArray(payload?.players)
    ? payload.players.map((player) => ({
        ...player,
        hand: Array.isArray(player.hand) ? player.hand : [],
        score:
          typeof player.score === "number"
            ? player.score
            : calculateHandValue(player.hand),
      }))
    : [];

  const dealerSource = payload?.dealer ?? { hand: [] };

  const dealer = Array.isArray(dealerSource)
    ? {
        id: 0,
        name: "Dealer",
        status: "playing",
        hand: dealerSource,
        score: calculateHandValue(dealerSource),
      }
    : {
        id: 0,
        name: "Dealer",
        status: dealerSource.status ?? "playing",
        hand: Array.isArray(dealerSource.hand) ? dealerSource.hand : [],
        score:
          typeof dealerSource.score === "number"
            ? dealerSource.score
            : calculateHandValue(dealerSource.hand ?? []),
      };

  return { players, dealer };
}

export function resultLabel(status) {
  switch (status) {
    case "win":
      return "Victoire";
    case "lost":
      return "Défaite";
    case "draw":
      return "Égalité";
    case "bust":
      return "Bust";
    case "blackjack":
      return "Blackjack";
    case "stood":
      return "Reste";
    case "playing":
      return "En jeu";
    default:
      return status ?? "";
  }
}
