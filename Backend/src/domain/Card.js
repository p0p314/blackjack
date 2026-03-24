export default class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.isRevealed = false;
  }

  reveal() {
    this.isRevealed = true;
  }

  isAs() {
    return this.rank === "A";
  }
}
