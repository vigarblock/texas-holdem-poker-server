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
});
