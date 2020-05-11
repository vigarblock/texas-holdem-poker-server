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
    game.on("communityUpdates", (data) => this._emitCommunityUpdates(gameId, data));
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
    console.log(this.games);
    const game = _.find(this.games, (game) => game.id === gameId);
    if (!game || !game.instance) {
      throw Error(`Game '${gameId}' was not found`);
    }

    return game.instance;
  }

  _emitPlayerUpdates(gameId, data){
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
  }
  
}

module.exports = new GameManager();
