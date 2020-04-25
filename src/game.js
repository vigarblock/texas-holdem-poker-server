const _ = require('lodash');

class Game {
  constructor() {
    this.name = "my-test-game";
    this.players = [];
    this.hand = { flop: [], turn: {}, river: {}, pot: 0 };
  }

  addPlayer(data) {
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

    console.log('New player', player);
  }

  getOpponentPlayers(currentPlayerId) {
    if(this.players.length == 0) {
      return []
    }

    const opponents = [];

    this.players.forEach((player) => {
      if(player.id !== currentPlayerId) {
        opponents.push(player);
      }
    });

    console.log('Opponents', opponents);

    return opponents;
  }

  getPlayer(playerId) {
    if(this.players.length == 0) {
      return undefined;
    }

    return _.find(this.players, (player) => player.id === playerId)
  }

  removePlayer(playerId) {
    _.remove(this.players, (player) => player.id === playerId);

    console.log('Player list updated', this.players)
  }
}

module.exports = new Game();
