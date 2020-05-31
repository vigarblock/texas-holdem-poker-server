const { v4: uuidv4 } = require("uuid");
const EventEmitter = require("events");
const _ = require("lodash");
const Game = require("./game");

const GameNotFoundError = require("./errors/gameNotFoundError");
const PlayerValidationError = require("./errors/playerValidationError");
const GameHasStartedError = require("./errors/gameHasStartedError");

class GameManager extends EventEmitter {
  constructor() {
    super();
    this.games = [];
  }

  createGame(minBet, startingChips) {
    const gameId = uuidv4();

    console.log(
      `Creating new game with Id ${gameId}, minBet ${minBet} and startingChips ${startingChips}. ` +
        `Total active games is ${this.games.length}`
    );
    const game = new Game(gameId, parseInt(minBet), parseInt(startingChips));

    game.on("handWinner", (data) => this._emitGameHandWinner(gameId, data));
    game.on("communityUpdates", (data) =>
      this._emitCommunityUpdates(gameId, data)
    );
    game.on("playerUpdates", (data) => this._emitPlayerUpdates(data));

    this.games.push({ id: gameId, instance: game });
    return gameId;
  }

  addPlayerToGame(gameId, name, playerId, socketId) {
    try {
      const game = this._getGameInstance(gameId);
      game.addPlayerToGame({ id: playerId, name, socketId });
      game.emitPlayerUpdates();
      return true;
    } catch (error) {
      let baseMessage;

      if (
        error instanceof PlayerValidationError ||
        error instanceof GameHasStartedError ||
        error instanceof GameNotFoundError
      ) {
        baseMessage = error.message;
      } else {
        baseMessage = `An error occurred when adding player to game: ${gameId}`;
      }
      console.log(`${baseMessage}. Details : ${error}`);
      this._emitPlayerError(gameId, { socketId, error: baseMessage });
      return false;
    }
  }

  startGame(gameId) {
    try {
      const game = this._getGameInstance(gameId);
      if (!game.hasGameStarted()) {
        game.initializeGame();
        game.startHand();
        game.emitPlayerUpdates();
      }
    } catch (error) {
      const baseMessage =
        error instanceof GameNotFoundError
          ? error.message
          : `An error occurred when starting game: ${gameId}`;
      console.log(`${baseMessage}. Details : ${error}`);
      this._emitGameError(gameId, baseMessage);
      this._removeGameInstance(gameId);
    }
  }

  playerAction(gameId, playerId, action, data) {
    try {
      const game = this._getGameInstance(gameId);
      game.playerAction(playerId, action, data);

      if (!game.hasHandEnded()) {
        game.emitPlayerUpdates();
        game.emitCommunityUpdates();
      }
    } catch (error) {
      const baseMessage =
        error instanceof GameNotFoundError
          ? error.message
          : `An error occurred when executing player -'${playerId}' ` +
            `action in game: ${gameId}. Unfortunately this crashed the game.`;
      console.log(`${baseMessage}. Details : ${error}`);
      this._emitGameError(gameId, baseMessage);
      this._removeGameInstance(gameId);
    }
  }

  playerExit(gameId, playerId) {
    try {
      const gameInstance = this._getGameInstance(gameId);
      gameInstance.removePlayer(playerId);

      const remainingPlayers = gameInstance.getActivePlayerCount();

      if (remainingPlayers === 1) {
        gameInstance.emitPlayerUpdates();
        gameInstance.stopWaitingForPlayerResponse();
        this._removeGameInstance(gameId);
      } else {
        gameInstance.emitPlayerUpdates();
      }
    } catch (error) {
      const baseMessage =
        error instanceof GameNotFoundError
          ? error.message
          : `An error occurred when removing player -'${playerId}' ` +
            `from game: ${gameId}. Unfortunately this crashed the game.`;
      console.log(`${baseMessage}. Details : ${error}`);
      this._emitGameError(gameId, baseMessage);
      this._removeGameInstance(gameId);
    }
  }

  _getGameInstance(gameId) {
    const game = _.find(this.games, (game) => game.id === gameId);
    if (!game || !game.instance) {
      throw new GameNotFoundError(
        `Game '${gameId}' was not found. You maybe be trying to ` +
          `enter a game that has already ended or one that does not exist.`
      );
    }

    return game.instance;
  }

  _removeGameInstance(gameId) {
    const index = this.games.findIndex((g) => g.id === gameId);

    if (index !== -1) {
      this.games[index].instance.stopWaitingForPlayerResponse();
      this.games[index].instance = null;
      this.games.splice(index, 1);

      console.log(`Removed game id ${gameId}`);
      console.log(`Total active games is ${this.games.length}`);
    }
  }

  _emitPlayerUpdates(updates) {
    this.emit("playerUpdates", { timeStamp: Date.now(), updates});
  }

  _emitCommunityUpdates(gameId, data) {
    data.gameId = gameId;
    this.emit("communityUpdates", data);
  }

  _emitGameHandWinner(gameId, data) {
    // If won, remove instance as game has ended
    if (data.gameWon) {
      this._removeGameInstance(gameId);
    }

    data.gameId = gameId;
    this.emit("gameHandWinner", data);
  }

  _emitGameError(gameId, error) {
    this.emit("gameError", { gameId, error });
  }

  _emitPlayerError(gameId, data) {
    this.emit("gamePlayerError", data);
  }
}

module.exports = new GameManager();
