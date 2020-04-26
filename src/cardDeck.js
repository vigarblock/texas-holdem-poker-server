const suits = ["Spade", "Diamond", "Club", "Heart"];
const values = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

class CardDeck {
  constructor() {
    this.deck = [];
    this._initializeDeck();
  }

  shuffle() {
    // for 1000 turns
    // switch the values of two random cards
    for (var i = 0; i < 1000; i++) {
      var location1 = Math.floor(Math.random() * this.deck.length);
      var location2 = Math.floor(Math.random() * this.deck.length);
      var tmp = this.deck[location1];

      this.deck[location1] = this.deck[location2];
      this.deck[location2] = tmp;
    }
  }

  takeCards(numOfCards) {
      const cards = [];

      for (let index = 0; index < numOfCards; index++) {
        const position = Math.floor(Math.random() * 52);
        cards.push(this.deck[position]);

        // TODO: Ensure cards are not null
        this.deck.splice(position, 1);
      }

      return cards;
  }

  _initializeDeck() {
    for (var i = 0; i < suits.length; i++) {
      for (var x = 0; x < values.length; x++) {
        var card = { value: values[x], suit: suits[i] };
        this.deck.push(card);
      }
    }
  }
}

module.exports = CardDeck;
