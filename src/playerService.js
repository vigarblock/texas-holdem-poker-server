const _ = require("lodash");
const PlayerValidationError = require('./errors/playerValidationError');
const MAX_PLAYER_LIMIT = 6;

class PlayerService {
  constructor() {
    this.players = [];
  }

  addPlayer(data) {
    const playerPosition = this.players.length + 1;
    if (playerPosition > MAX_PLAYER_LIMIT) {
      throw new PlayerValidationError("Game has reached maximum allowed players");
    }

    const playerExists = this.getPlayer(data.id);

    if(!playerExists) {
      const player = {
        id: data.id,
        socketId: data.socketId,
        isActive: false,
        callAmount: 0,
        minRaiseAmount: 0,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
        position: playerPosition,
        name: data.name,
        coins: 0,
        action: { name: "Joined", value: "" },
        playerHand: [],
        hasLeft: false,
        hasLost: false,
      };
  
      this.players.push(player);
    } else {
      if(playerExists.hasLeft) {
        throw new PlayerValidationError("You cannot re-join a game you left");
      }
      // Player disconnections will result in player being added back with 
      // new socket connection. Therefore, just update the socket ID
      this.updatePlayer(data.id, { socketId: data.socketId })
    }
  }

  updatePlayer(
    playerId,
    {
      socketId,
      isActive,
      isSmallBlind,
      isBigBlind,
      isDealer,
      coins,
      callAmount,
      minRaiseAmount,
      action,
      playerHand,
      hasLeft,
      hasLost,
    }
  ) {
    this.players.forEach((player) => {
      if (playerId === player.id) {
        if (socketId !== undefined) {
          player.socketId = socketId;
        }

        if (isActive !== undefined) {
          player.isActive = isActive;
        }

        if (isDealer !== undefined) {
          player.isDealer = isDealer;
        }

        if (isSmallBlind !== undefined) {
          player.isSmallBlind = isSmallBlind;
        }

        if (isBigBlind !== undefined) {
          player.isBigBlind = isBigBlind;
        }

        if (coins !== undefined) {
          player.coins = coins;
        }

        if (callAmount !== undefined) {
          player.callAmount = callAmount;
        }

        if (minRaiseAmount !== undefined) {
          player.minRaiseAmount = minRaiseAmount;
        }

        if (action !== undefined) {
          player.action = action;
        }

        if (playerHand !== undefined) {
          player.playerHand = playerHand;
        }

        if (hasLeft !== undefined) {
          player.hasLeft = hasLeft;
        }

        if (hasLost !== undefined) {
          player.hasLost = hasLost;
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
