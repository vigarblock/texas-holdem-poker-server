class GameHasStartedError extends Error {
  constructor(message) {
    super(message);
    this.name = "GameHasStartedError";
  }
}

module.exports = GameHasStartedError;