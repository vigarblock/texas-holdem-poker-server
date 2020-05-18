const assert = require("assert");
const handRanker = require("../../src/texas-holdem/handRanker");

describe("Hank Ranker", () => {
  describe("Is Royal Flush", () => {
    it("Should return true when a royal flush is found", () => {
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

      const expected = [
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "K" },
        { suit: "Heart", value: "Q" },
        { suit: "Heart", value: "10" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isRoyalFlush(cards);

      // Assert
      assert.equal(result.outcome, true);
      assert.deepEqual(result.cards, expected);
    });

    it("Should return false when a royal flush is not found", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "K" },
        { suit: "Heart", value: "2" },
        { suit: "Diamond", value: "5" },
        { suit: "Heart", value: "10" },
        { suit: "Spade", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isRoyalFlush(cards);

      // Assert
      assert.equal(result.outcome, false);
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

      const expected = [
        { suit: "Heart", value: "Q" },
        { suit: "Heart", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "10" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isStraightFlush(cards);

      // Assert
      assert.equal(result.outcome, true);
      assert.deepEqual(result.cards, expected);
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
      const result = handRanker.isStraightFlush(cards);

      // Assert
      assert.equal(result.outcome, false);
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
      const result = handRanker.isStraightFlush(cards);

      // Assert
      assert.equal(result.outcome, false);
    });
  });

  describe("Is Four of a Kind", () => {
    it("Should return true when four of a kind", () => {
      // Arrange
      const cards = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Club", value: "Q" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "Q" },
      ];

      const expected = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Club", value: "Q" },
        { suit: "Heart", value: "Q" },
      ];

      // Act
      const result = handRanker.isFourOfAKind(cards);

      // Assert
      assert.equal(result.outcome, true);
      assert.deepEqual(result.cards, expected);
    });

    it("Should return false when not four of a kind", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "2" },
        { suit: "Heart", value: "K" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "5" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isFourOfAKind(cards);

      // Assert
      assert.equal(result.outcome, false);
    });
  });

  describe("Is Full house", () => {
    it("Should return true when full house", () => {
      // Arrange
      const cards = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "K" },
        { suit: "Club", value: "Q" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "Q" },
      ];

      const expected = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "K" },
        { suit: "Club", value: "Q" },
        { suit: "Heart", value: "Q" },
      ];

      // Act
      const result = handRanker.isFullHouse(cards);

      // Assert
      assert.equal(result.outcome, true);
      assert.deepEqual(result.cards, expected);
    });

    it("Should return false when not full house", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "2" },
        { suit: "Heart", value: "K" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "5" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isFullHouse(cards);

      // Assert
      assert.equal(result.outcome, false);
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

      const expected = [
        { suit: "Heart", value: "8" },
        { suit: "Heart", value: "K" },
        { suit: "Heart", value: "Q" },
        { suit: "Heart", value: "10" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isFlush(cards);

      // Assert
      assert.equal(result.outcome, true);
      assert.deepEqual(result.cards, expected);
    });

    it("Should return false when a flush is not found", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "8" },
        { suit: "Heart", value: "K" },
        { suit: "Heart", value: "Q" },
        { suit: "Diamond", value: "Q" },
        { suit: "Diamond", value: "10" },
        { suit: "Spade", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isFlush(cards);

      // Assert
      assert.equal(result.outcome, false);
    });
  });

  describe("Is Straight", () => {
    it("Should return true when a straight is found", () => {
      // Arrange
      const cards = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Club", value: "10" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      const expected = [
        { suit: "Club", value: "10" },
        { suit: "Heart", value: "J" },
        { suit: "Spade", value: "Q" },
        { suit: "Spade", value: "K" },        
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isStraight(cards);

      // Assert
      assert.equal(result.outcome, true);
      assert.deepEqual(result.cards, expected);
    });

    it("Should return false when a straight is not found", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "2" },
        { suit: "Heart", value: "K" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "5" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isStraight(cards);

      // Assert
      assert.equal(result.outcome, false);
    });
  });

  describe("Is Three of a Kind", () => {
    it("Should return true when three of a kind", () => {
      // Arrange
      const cards = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Club", value: "Q" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "2" },
      ];

      const expected = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Club", value: "Q" },
      ];

      // Act
      const result = handRanker.isThreeOfAKind(cards);

      // Assert
      assert.equal(result.outcome, true);
      assert.deepEqual(result.cards, expected);
    });

    it("Should return false when not three of a kind", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "2" },
        { suit: "Heart", value: "K" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "5" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isThreeOfAKind(cards);

      // Assert
      assert.equal(result.outcome, false);
    });
  });

  describe("Is Two Pair", () => {
    it("Should return true when two pair is found", () => {
      // Arrange
      const cards = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Club", value: "7" },
        { suit: "Diamond", value: "J" },
        { suit: "Heart", value: "2" },
      ];

      const expected = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Heart", value: "J" },
        { suit: "Diamond", value: "J" },
      ];

      // Act
      const result = handRanker.isTwoPair(cards);

      // Assert
      assert.equal(result.outcome, true);
      assert.deepEqual(result.cards, expected);
    });

    it("Should return top 2 pairs when more then 2 pairs found", () => {
      // Arrange
      const cards = [
        { suit: "Spade", value: "2" },
        { suit: "Heart", value: "2" },
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Heart", value: "10" },
        { suit: "Diamond", value: "A" },
        { suit: "Club", value: "10" },
      ];

      const expected = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Heart", value: "10" },
        { suit: "Club", value: "10" },
      ];

      // Act
      const result = handRanker.isTwoPair(cards);

      // Assert
      assert.equal(result.outcome, true);
      assert.deepEqual(result.cards, expected);
    });

    it("Should return false when two pair is not found", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "2" },
        { suit: "Heart", value: "K" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "5" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isTwoPair(cards);

      // Assert
      assert.equal(result.outcome, false);
    });
  });

  describe("Is One Pair", () => {
    it("Should return true when one pair is found", () => {
      // Arrange
      const cards = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "7" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Club", value: "Q" },
        { suit: "Diamond", value: "4" },
        { suit: "Heart", value: "2" },
      ];

      const expected = [
        { suit: "Spade", value: "Q" },
        { suit: "Club", value: "Q" },
      ];

      // Act
      const result = handRanker.isOnePair(cards);

      // Assert
      assert.equal(result.outcome, true);
      assert.deepEqual(result.cards, expected);
    });

    it("Should return false when one pair is not found", () => {
      // Arrange
      const cards = [
        { suit: "Heart", value: "2" },
        { suit: "Heart", value: "K" },
        { suit: "Spade", value: "4" },
        { suit: "Heart", value: "J" },
        { suit: "Heart", value: "5" },
        { suit: "Diamond", value: "3" },
        { suit: "Heart", value: "A" },
      ];

      // Act
      const result = handRanker.isOnePair(cards);

      // Assert
      assert.equal(result.outcome, false);
    });
  });

  describe("Get High Card", () => {
    it("Should return card with highest rank", () => {
      // Arrange
      const cards = [
        { suit: "Spade", value: "Q" },
        { suit: "Heart", value: "Q" },
        { suit: "Spade", value: "K" },
        { suit: "Heart", value: "J" },
        { suit: "Club", value: "Q" },
        { suit: "Diamond", value: "J" },
        { suit: "Heart", value: "2" },
      ];

      const expected = [
        { suit: "Spade", value: "K" },
      ];

      // Act
      const result = handRanker.getHighCard(cards);

      // Assert
      assert.deepEqual(result.cards, expected);
    });
  });
});
