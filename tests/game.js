const sinon = require("sinon");
const assert = require("assert");
const Game = require("../src/game");
const gameState = require('../src/constants/gameState');
const bettingState = require('../src/constants/bettingState');

describe("Game", () => {
  let clock;
  let game;
  let minBet = 20;
  let startingPlayerCoins = 1000;

  beforeEach(() => {
    clock = sinon.useFakeTimers();

    game = new Game("123456", minBet, startingPlayerCoins);
    game.addPlayerToGame({ id: "1", name: "player1", socketId: "s1" });
    game.addPlayerToGame({ id: "2", name: "player2", socketId: "s2" });
    game.addPlayerToGame({ id: "3", name: "player3", socketId: "s3" });
    game.addPlayerToGame({ id: "4", name: "player4", socketId: "s4" });
    game.addPlayerToGame({ id: "5", name: "player5", socketId: "s5" });
    game.addPlayerToGame({ id: "6", name: "player6", socketId: "s6" });
    game.initializeGame();
    game.startHand();
  });

  afterEach(() => {
    game.stopWaitingForPlayerResponse();
    clock.restore();
  });

  it("Should determine the player roles based on joining positions when first hand starts", () => {
    // Arrange
    const dealerId = "1";
    const smallBlindId = "2";
    const bigBlindId = "3";
    const firstActivePlayerId = "4";

    // Act and assert
    assert.equal(game.getPlayer(dealerId).isDealer, true);
    assert.equal(game.getPlayer(smallBlindId).isSmallBlind, true);
    assert.equal(game.getPlayer(bigBlindId).isBigBlind, true);
    assert.equal(game.getPlayer(firstActivePlayerId).isActive, true);
  });

  it("Should progress game by determining next active player until bet agreement is reached", () => {
    // Arrange
    const expectedStartBetState = bettingState.PREFLOPBET;
    const expectedEndBettingState = bettingState.FLOPBET;

    // Act and assert
    assert.equal(game.hand.state, expectedStartBetState);

    game.playerAction("4", "call", game.getPlayer("4").callAmount);
    assert.equal(game.getPlayer('5').isActive, true);
    game.playerAction("5", "call", game.getPlayer("5").callAmount);
    assert.equal(game.getPlayer('6').isActive, true);
    game.playerAction("6", "fold", null);
    assert.equal(game.getPlayer('1').isActive, true);
    game.playerAction("1", "fold", null);
    assert.equal(game.getPlayer('2').isActive, true);
    game.playerAction("2", "call", game.getPlayer("2").callAmount);
    assert.equal(game.getPlayer('3').isActive, true);
    game.playerAction("3", "fold", null);

    assert.equal(game.hand.state, expectedEndBettingState);
  });

  it("Should reach bet agreement successfully in scenarios where a player leave during a hand", () => {
    // Arrange
    const expectedStartBetState = bettingState.PREFLOPBET;
    const expectedEndBettingState = bettingState.FLOPBET;

    // Act and assert
    assert.equal(game.hand.state, expectedStartBetState);

    game.playerAction("4", "call", game.getPlayer("4").callAmount);
    assert.equal(game.getPlayer('5').isActive, true);

    game.playerAction("5", "call", game.getPlayer("4").callAmount);
    assert.equal(game.getPlayer('6').isActive, true);

    game.playerAction("6", "call", game.getPlayer("4").callAmount);
    assert.equal(game.getPlayer('1').isActive, true);

    game.removePlayer('1');
    assert.equal(game.getPlayer('2').isActive, true);

    game.playerAction("2", "call", game.getPlayer("2").callAmount);
    assert.equal(game.getPlayer('3').isActive, true);

    game.playerAction("3", "fold", null);

    assert.equal(game.hand.state, expectedEndBettingState);
  });

  it("Should determine the call amount of starting player correctly in a game with more than 2 players", () => {
    // Arrange
    const expectedAmount = 20;
    const expectedStartingPlayerId = "4";

    // Act
    const startingPlayer = game.getPlayer(expectedStartingPlayerId);

    // Assert
    assert.equal(startingPlayer.isActive, true);
    assert.equal(startingPlayer.callAmount, expectedAmount);
  });

  it("Should determine the call amount of starting player correctly in a 2 player game", () => {
    // P1 is dealer, therefore initial contribution is 0.
    // P2 is small blind, therefore contribution is 1/2 min bet = 10.
    // Since only 2 player game, P1 is also big blind, therefore contribution is min bet = 20;
    // P2 is active as they are next to big blind. Since 1/2 bet was contributed, call amount should be 10.

    // Arrange
    game = new Game("123456", minBet, startingPlayerCoins);
    game.addPlayerToGame({ id: "1", name: "player1", socketId: "s1" });
    game.addPlayerToGame({ id: "2", name: "player2", socketId: "s2" });
    game.initializeGame();
    game.startHand();

    // Act
    const startingPlayer = game.getPlayer("2");

    // Assert
    assert.equal(startingPlayer.isActive, true);
    assert.equal(startingPlayer.callAmount, 10);
  });
});
