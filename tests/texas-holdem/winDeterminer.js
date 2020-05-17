const assert = require("assert");
const winDeterminer = require("../../src/texas-holdem/winDeterminer");
const texasHoldemRankings = require("../../src/constants/texasHoldemRankings");

describe("Win Determiner", () => {
  it("Should return winning player when one player has higher rank than the rest", () => {
    // Arrange
    const communityCards = [
      { suit: "Heart", value: "3" },
      { suit: "Heart", value: "K" },
      { suit: "Spade", value: "Q" },
      { suit: "Diamond", value: "5" },
      { suit: "Heart", value: "7" },
    ];

    const players = [
      {
        id: "foo",
        playerHand: [
          { suit: "Spade", value: "J" },
          { suit: "Heart", value: "Q" },
        ],
      },
      {
        id: "bar",
        playerHand: [
          { suit: "Club", value: "K" },
          { suit: "Heart", value: "K" },
        ],
      },
    ];

    // Act
    const result = winDeterminer.getWinner(players, communityCards);

    // Assert
    assert.equal(result.winners.length, 1);
    assert.equal(result.winners[0].id, "bar");
    assert.equal(result.winningRankMessage, texasHoldemRankings[7]);
  });

  it("Should return winner based on high card within rank when ranks are tied", () => {
    // Arrange
    const communityCards = [
      { suit: "Heart", value: "2" },
      { suit: "Club", value: "3" },
      { suit: "Heart", value: "6" },
      { suit: "Diamond", value: "7" },
      { suit: "Heart", value: "8" },
    ];

    const players = [
      {
        id: "foo",
        playerHand: [
          { suit: "Spade", value: "4" },
          { suit: "Heart", value: "5" },
        ],
      },
      {
        id: "bar",
        playerHand: [
          { suit: "Club", value: "9" },
          { suit: "Heart", value: "10" },
        ],
      },
    ];

    // Act
    const result = winDeterminer.getWinner(players, communityCards);

    // Assert
    assert.equal(result.winners.length, 1);
    assert.equal(result.winners[0].id, "bar");
    assert.equal(result.winningRankMessage, texasHoldemRankings[6]);
  });

  it("Should return winner based on player's initial hand when ranks are tied", () => {
    // Arrange
    const communityCards = [
      { suit: "Heart", value: "2" },
      { suit: "Club", value: "3" },
      { suit: "Heart", value: "6" },
      { suit: "Diamond", value: "K" },
      { suit: "Heart", value: "8" },
    ];

    const players = [
      {
        id: "foo",
        playerHand: [
          { suit: "Spade", value: "J" },
          { suit: "Heart", value: "K" },
        ],
      },
      {
        id: "bar",
        playerHand: [
          { suit: "Club", value: "Q" },
          { suit: "Heart", value: "K" },
        ],
      },
    ];

    // Act
    const result = winDeterminer.getWinner(players, communityCards);

    // Assert
    assert.equal(result.winners.length, 1);
    assert.equal(result.winners[0].id, "bar");
    assert.equal(result.winningRankMessage, texasHoldemRankings[9]);
  });

  it("Should return winner based on player's initial hand when ranks are tied", () => {
    // Arrange
    const communityCards = [
      { suit: "Heart", value: "2" },
      { suit: "Club", value: "3" },
      { suit: "Heart", value: "8" },
      { suit: "Diamond", value: "8" },
      { suit: "Heart", value: "J" },
    ];

    const players = [
      {
        id: "foo",
        playerHand: [
          { suit: "Spade", value: "5" },
          { suit: "Club", value: "K" },
        ],
      },
      {
        id: "bar",
        playerHand: [
          { suit: "Club", value: "5" },
          { suit: "Heart", value: "K" },
        ],
      },
    ];

    // Act
    const result = winDeterminer.getWinner(players, communityCards);

    // Assert
    assert.equal(result.winners.length, 2);
    assert.equal(result.winners[0].id, "foo");
    assert.equal(result.winners[1].id, "bar");
    assert.equal(result.winningRankMessage, texasHoldemRankings[9]);
  });
});
