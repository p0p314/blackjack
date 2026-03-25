export default class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.status = "playing";
    this.hand = [];
  }

  addCard(card) {
    if (this.name !== "Dealer") {
      card.reveal();
    }
    this.hand.push(card);
  }

  applyAsValue(cardAlias, value) {
    let card = this.hand.find((card) => card.alias == cardAlias);
    card.value = value;
  }

  changeStatus(status) {
    this.status = status;
  }
}
