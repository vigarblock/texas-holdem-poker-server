var assert = require("assert");
var texasHoldem = require("../src/texasHoldem");

describe("Texas Holdem", () => {
  describe("Is Royal Flush", () => {
    it("Should return true when a royal is found", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "K" },
        { suit: "Heart", value: "Q" },
        { suit: "Diamond", value: "5" },
        { suit: "Heart", value: "10" },
        { suit: "Spade", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = texasHoldem.isRoyalFlush(cards);

      // Assert
      assert.equal(result, true);
    });
  });

  describe("Is Flush", () => {
    it("Should return true when a flush is found", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "8" },
        { suit: "Heart", value: "K" },
        { suit: "Heart", value: "Q" },
        { suit: "Diamond", value: "Q" },
        { suit: "Heart", value: "10" },
        { suit: "Spade", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = texasHoldem.isFlush(cards);

      // Assert
      assert.equal(result, true);
    });
  });

  describe("Is Straight Flush", () => {
    it("Should return true when a straight flush is found", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "Q" },
        { suit: "Heart", value: "K" },
        { suit: "Spade", value: "3" },
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "10" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = texasHoldem.isStraightFlush(cards);

      // Assert
      assert.equal(result, true);
    });

    it("Should return false given straight ranks but not flush suits", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "Q" },
        { suit: "Heart", value: "K" },
        { suit: "Spade", value: "3" },
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "10" },
        { suit: "Diamond", value: "3" },
        { suit: "Diamond", value: "A" },
      ];

      // Act
      const result = texasHoldem.isStraightFlush(cards);

      // Assert
      assert.equal(result, false);
    });

    it("Should return false given flush suits but not straight ranks", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "Q" },
        { suit: "Heart", value: "K" },
        { suit: "Spade", value: "3" },
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "5" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = texasHoldem.isStraightFlush(cards);

      // Assert
      assert.equal(result, false);
    });
  });
});
