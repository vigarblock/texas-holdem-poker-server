class GameNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "GameNotFound";
  }
}

module.exports = GameNotFoundError;
