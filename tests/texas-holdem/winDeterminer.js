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
    const result = winDeterminer.getWinners(players, communityCards);

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
    const result = winDeterminer.getWinners(players, communityCards);

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
    const result = winDeterminer.getWinners(players, communityCards);

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
    const result = winDeterminer.getWinners(players, communityCards);

    // Assert
    assert.equal(result.winners.length, 2);
    assert.equal(result.winners[0].id, "foo");
    assert.equal(result.winners[1].id, "bar");
    assert.equal(result.winningRankMessage, texasHoldemRankings[9]);
  });

  it("Should return winner with best pair in tied two pair rankings", () => {
    // Arrange
    const communityCards = [
      { suit: "Diamond", value: "2" },
      { suit: "Club", value: "2" },
      { suit: "Spade", value: "Q" },
      { suit: "Spade", value: "Q" },
      { suit: "Diamond", value: "10" },
    ];

    const players = [
      {
        id: "foo",
        playerHand: [
          { suit: "Heart", value: "8" },
          { suit: "Diamond", value: "6" },
        ],
      },
      {
        id: "bar",
        playerHand: [
          { suit: "Spade", value: "10" },
          { suit: "Club", value: "A" },
        ],
      },
    ];

    // Act
    const result = winDeterminer.getWinners(players, communityCards);

    // Assert
    assert.equal(result.winners.length, 1);
    assert.equal(result.winners[0].id, "bar");
    assert.equal(result.winningRankMessage, texasHoldemRankings[8]);
  });

  it("Should return winner with higher player hand when two players have tied flush ranks", () => {
    // Arrange
    const communityCards = [
      { suit: "Club", value: "5" },
      { suit: "Spade", value: "4" },
      { suit: "Spade", value: "A" },
      { suit: "Spade", value: "Q" },
      { suit: "Diamond", value: "Q" },
    ];

    const players = [
      {
        id: "foo",
        playerHand: [
          { suit: "Spade", value: "9" },
          { suit: "Spade", value: "3" },
        ],
      },
      {
        id: "bar",
        playerHand: [
          { suit: "Heart", value: "K" },
          { suit: "Club", value: "2" },
        ],
      },
      {
        id: "foo-bar",
        playerHand: [
          { suit: "Spade", value: "J" },
          { suit: "Spade", value: "8" },
        ],
      },
    ];

    // Act
    const result = winDeterminer.getWinners(players, communityCards);

    // Assert
    assert.equal(result.winners.length, 1);
    assert.equal(result.winners[0].id, "foo-bar");
    assert.equal(result.winningRankMessage, texasHoldemRankings[5]);
  });
});
