class PlayerValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = "PlayerValidationError";
    }
  }
  
  module.exports = PlayerValidationError;