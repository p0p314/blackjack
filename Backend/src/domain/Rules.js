// rules.js
export function calculateHandValue(cards) {
  let total = 0;
  let aces = 0;
  cards.forEach((card) => {
    if (card.isAs()) {
      aces += 1;
    }
    total += parseInt(card.value);
  });

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

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
