const _ = require("lodash");
const MAX_PLAYER_LIMIT = 5;

class PlayerService {
  constructor() {
    this.players = [];
  }

  addPlayer(data) {
    const playerPosition = this.players.length + 1;
    if (playerPosition > MAX_PLAYER_LIMIT) {
      throw Error("Game has reached maximum allowed players");
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
  }

  updatePlayer(playerId, { isActive, coins, action, playerHand }) {
    this.players.forEach((player) => {
      if (playerId === player.id) {
        if (isActive !== undefined) {
          player.isActive = isActive;
        }

        if (coins !== undefined) {
          player.coins = coins;
        }

        if (action !== undefined) {
          player.action = action;
        }

        if (playerHand !== undefined) {
          player.playerHand = playerHand;
        }

        return player;
      }
    });
  }

  getPlayer(playerId) {
    if (this.players.length == 0) {
      return undefined;
    }

    return _.find(this.players, (player) => player.id === playerId);
  }

  getPlayerByPosition(playerPosition) {
    if (this.players.length == 0) {
      return undefined;
    }

    return _.find(this.players, (player) => player.position === playerPosition);
  }

  getAllPlayers() {
    return [...this.players];
  }

  getOpponentPlayers(currentPlayerId) {
    const opponents = [];

    this.players.forEach((player) => {
      if (player.id !== currentPlayerId) {

        const opponent = Object.assign({}, player);

        // Remove opponent hand data
        opponent.playerHand = [];

        opponents.push(opponent);
      }
    });

    return opponents;
  }

  removePlayer(playerId) {
    _.remove(this.players, (player) => player.id === playerId);
  }
}

module.exports = PlayerService;
