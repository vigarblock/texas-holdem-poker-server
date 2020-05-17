const assert = require("assert");
const winDeterminer = require("../../src/texas-holdem/winDeterminer");
const texasHoldemRankings = require("../../src/constants/texasHoldemRankings");


describe.only("Win Determiner", () => {
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
    assert.equal(result.winner.id, "bar");
    assert.equal(result.winningRankMessage, texasHoldemRankings[7]);
  });

  it("Should return winning player when all players have the same rank", () => {
    // Arrange
    const communityCards = [
      { suit: "Heart", value: "A" },
      { suit: "Heart", value: "5" },
      { suit: "Spade", value: "A" },
      { suit: "Diamond", value: "Q" },
      { suit: "Heart", value: "3" },
    ];

    const players = [
      {
        id: "foo",
        playerHand: [
          { suit: "Spade", value: "Q" },
          { suit: "Heart", value: "J" },
        ],
      },
      {
        id: "bar",
        playerHand: [
          { suit: "Club", value: "Q" },
          { suit: "Heart", value: "4" },
        ],
      },
    ];

    // Act
    const result = winDeterminer.getWinner(players, communityCards);

    // Assert
    // assert.equal(result.winner.id, "bar");
    // assert.equal(result.winningRankMessage, texasHoldemRankings[7]);
  });
});
