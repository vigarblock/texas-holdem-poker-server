const { v4: uuidv4 } = require("uuid");
const EventEmitter = require("events");
const _ = require("lodash");
const Game = require("./game");

class GameManager extends EventEmitter {
  constructor() {
    super();
    this.games = [];
  }

  createGame() {
    const gameId = uuidv4();
    const game = new Game(gameId);

    game.on("handWinner", (data) => {
      data.gameId = gameId;
      this.emit("gameHandWinner", data);
    });

    game.on("gameWinner", (data) => {
      data.gameId = gameId;
      this.emit("gameWinner", data);
    });

    this.games.push({ id: gameId, instance: game });
    return gameId;
  }

  getGameInstance(gameId) {
    const game = _.find(this.games, (game) => game.id === gameId);
    if (!game || !game.instance) {
      throw Error(`Game '${gameId}' was not found`);
    }

    return game.instance;
  }
}

module.exports = new GameManager();
