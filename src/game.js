const _ = require("lodash");
const CardDeck = require("./cardDeck");
const PLAYER_LIMIT = 5;

class Game {
  constructor() {
    this.name = "my-test-game";
    this.players = [];
    this.hand = { cardDeck: {}, flop: [], turn: {}, river: {}, pot: 0 };
  }

  startHand() {
    this.hand.cardDeck = new CardDeck();
    this.hand.cardDeck.shuffle();

    // Assign each player 2 cards from the deck
    for (let index = 0; index < this.players.length; index++) {
      const cards = this.hand.cardDeck.takeCards(2);

      this.players[index].playerHand = [
        { suit: cards[0].suit, cardValue: cards[0].value },
        { suit: cards[1].suit, cardValue: cards[1].value },
      ];

      if(this.players[index].position === 1){
        this.players[index].isActive = true;
      }
    }
  }

  dealFlop() {
    // TODO
  }

  dealTurnCard() {
    // TODO
  }

  dealRiverCard() {
    // TODO
  }

  determineWinner() {
    // TODO
  }

  // TODO: Move player handling into own class
  addPlayer(data) {
    const playerPosition = this.players.length + 1;
    if (playerPosition > PLAYER_LIMIT) {
      throw Error("The game is full");
    }
    const player = {
      id: data.id,
      isActive: false,
      position: this.players.length + 1,
      name: data.name,
      coins: 0,
      action: { name: "Joined", value: "" },
      playerHand: [],
    };

    this.players.push(player);

    console.log("New player", player);
  }

  updatePlayer(playerId, { isActive, coins, action, playerHand }) {
    const updatedPlayer = this.players.forEach((player) => {
      if (playerId === player.id) {
        if (isActive) {
          player.isActive = isActive;
        }

        if (coins) {
          player.coins = coins;
        }

        if (action) {
          player.action = action;
        }

        if (playerHand) {
          player.playerHand = playerHand;
        }

        return player;
      }
    });
  }

  getOpponentPlayers(currentPlayerId) {
    if (this.players.length == 0) {
      return [];
    }

    const opponents = [];

    // TODO: Remove player hand details
    this.players.forEach((player) => {
      if (player.id !== currentPlayerId) {
        opponents.push(player);
      }
    });

    return opponents;
  }

  getPlayer(playerId) {
    if (this.players.length == 0) {
      return undefined;
    }

    return _.find(this.players, (player) => player.id === playerId);
  }

  getAllPlayers() {
    return this.players;
  }

  removePlayer(playerId) {
    _.remove(this.players, (player) => player.id === playerId);

    console.log("Player list updated", this.players);
  }
}

module.exports = new Game();
