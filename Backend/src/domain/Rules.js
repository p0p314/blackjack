// rules.js
export function calculateHandValue(cards) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    // console.log(`Calculating value for card: ${card.value} of ${card.suit}`);
    if (card.suit === "A") {
      aces++;
      total += 11;
    } else if (["K", "Q", "J"].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  // console.log(`Total hand value: ${total} (with ${aces} aces)`);
  return total;
}

export function isBlackjack(cards) {
  return cards.length === 2 && calculateHandValue(cards) === 21;
}

export function isBust(cards) {
  return calculateHandValue(cards) > 21;
}

export function shouldDealerHit(dealerCards) {
  return calculateHandValue(dealerCards) < 17;
}

export function is21(cards) {
  return calculateHandValue(cards) === 21;
}

export function determineWinner(players, dealer) {
  players.forEach((player) => {
    if (isBust(player.hand)) {
      player.changeStatus("lost");
      console.log("lost");
    } else if (isBust(dealer.hand)) {
      player.changeStatus("win");
      console.log("win");
    } else {
      player.changeStatus("draw");
      console.log("draw");
    }
  });

  console.log("envoyer les résultats aux clients");
}
