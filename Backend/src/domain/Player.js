export default class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.status = "playing"; // playing, stood, busted
    this.hand = [];
  }

  addCard(card) {
    if (this.name !== "Dealer") {
      card.reveal();
    }
    this.hand.push(card);
  }

  changeStatus(status) {
    this.status = status;
  }
}
