export default class Card {
  constructor(suit, rank, value = null) {
    this.suit = suit;
    this.rank = rank;
    this.value = (value ?? ["K", "Q", "J"].includes(rank)) ? 10 : rank;
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
