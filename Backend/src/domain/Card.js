export default class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.alias = `${suit[0]}${rank}`;
    this.isReveaed = false;
  }

  reveal() {
    this.isRevealed = true;
  }

  isAs() {
    return this.rank === "A";
  }
}
