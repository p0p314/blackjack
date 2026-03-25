export default class Card {
  constructor(suit, rank, value = null) {
    this.suit = suit;
    this.rank = rank;
    this.value =
      value ??
      (["K", "Q", "J"].includes(rank)
        ? 10
        : ["A"].includes(rank)
          ? 11
          : parseInt(rank));
    this.alias = `${suit[0]}${rank}`;
    this.isRevealed = false;
  }

  reveal() {
    this.isRevealed = true;
  }

  isAs() {
    return this.rank === "A";
  }
}
