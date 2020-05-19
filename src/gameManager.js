const { v4: uuidv4 } = require("uuid");
const EventEmitter = require("events");
const _ = require("lodash");
const Game = require("./game");

class GameManager extends EventEmitter {
  constructor() {
    super();

    const gameId = "123456";
    const game = new Game(gameId, 1000);

    game.on("handWinner", (data) => this._emitGameHandWinner(gameId, data));
    game.on("gameWinner", (data) => this._emitGameWinner(gameId, data));
    game.on("playerUpdates", (data) => this._emitPlayerUpdates(gameId, data));
    game.on("communityUpdates", (data) =>
      this._emitCommunityUpdates(gameId, data)
    );
    this.games = [{ id: gameId, instance: game }];
  }

  createGame() {
    const gameId = uuidv4();
    const game = new Game(gameId, 1000);

    game.on("handWinner", (data) => this._emitGameHandWinner(gameId, data));
    game.on("gameWinner", (data) => this._emitGameWinner(gameId, data));
    game.on("playerUpdates", (data) => this._emitPlayerUpdates(gameId, data));

    this.games.push({ id: gameId, instance: game });
    return gameId;
  }

  getGameInstance(gameId) {
    const game = _.find(this.games, (game) => game.id === gameId);
    if (!game || !game.instance) {
      throw Error(
        `Game '${gameId}' was not found. You maybe be trying to ` +
          `enter a game that has already ended or one that does not exist.`
      );
    }

    return game.instance;
  }

  playerExit(gameId, playerId) {
    const gameInstance = this.getGameInstance(gameId);
    gameInstance.removePlayer(playerId);

    const remainingPlayers = gameInstance.getActivePlayerCount();

    if (remainingPlayers === 1) {
      gameInstance.stopWaitingForPlayerResponse();
      const remainingPlayer = gameInstance.getAllPlayers().find(p => p.hasLeft === false);
      this._emitGameWinner(gameId, remainingPlayer)
    } else {
      gameInstance.emitPlayerUpdates();
    }
  }

  _emitPlayerUpdates(gameId, data) {
    data.gameId = gameId;
    this.emit("playerUpdates", data);
  }

  _emitCommunityUpdates(gameId, data) {
    data.gameId = gameId;
    this.emit("communityUpdates", data);
  }

  _emitGameHandWinner(gameId, data) {
    data.gameId = gameId;
    this.emit("gameHandWinner", data);
  }

  _emitGameWinner(gameId, data) {
    data.gameId = gameId;
    this.emit("gameWinner", data);

    // Remove game from array
    const index = this.games.findIndex(g => g.id === gameId);
    this.games[index].instance = null;
    this.games.splice(index, 1);
  }
}

module.exports = new GameManager();
