const { suits, values } = require('../src/constants/cards');

class CardDeck {
  constructor() {
    this.deck = [];
    this.totalCards = 52;
    this._initializeDeck();
  }

  shuffle() {
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
        const position = Math.floor(Math.random() * this.totalCards);
        cards.push(this.deck[position]);
        this.deck.splice(position, 1);
        this.totalCards -= 1;
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
