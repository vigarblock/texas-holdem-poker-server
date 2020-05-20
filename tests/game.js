const sinon = require("sinon");
const assert = require("assert");
const Game = require("../src/game");
const gameState = require('../src/constants/gameState');
const bettingState = require('../src/constants/bettingState');

describe("Game", () => {
  let clock;
  let game;
  let startingPlayerCoins = 1000;

  beforeEach(() => {
    clock = sinon.useFakeTimers();

    game = new Game("123456", startingPlayerCoins);
    game.addPlayerToGame({ id: "1", name: "player1", socketId: "s1" });
    game.addPlayerToGame({ id: "2", name: "player2", socketId: "s2" });
    game.addPlayerToGame({ id: "3", name: "player3", socketId: "s3" });
    game.addPlayerToGame({ id: "4", name: "player4", socketId: "s4" });
    // game.addPlayerToGame({ id: "5", name: "player5", socketId: "s5" });
    // game.addPlayerToGame({ id: "6", name: "player6", socketId: "s6" });
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

  it.only("Should reach bet agreement successfully in scenarios where a player leave during a hand", () => {
    // Arrange
    const expectedStartBetState = bettingState.PREFLOPBET;
    const expectedEndBettingState = bettingState.FLOPBET;

    // Act and assert
    assert.equal(game.hand.state, expectedStartBetState);

    game.playerAction("4", "call", game.getPlayer("4").callAmount);
    assert.equal(game.getPlayer('1').isActive, true);

    game.removePlayer('1');
    assert.equal(game.getPlayer('2').isActive, true);

    game.playerAction("2", "call", game.getPlayer("2").callAmount);
    assert.equal(game.getPlayer('3').isActive, true);

    game.playerAction("3", "fold", null);

    assert.equal(game.hand.state, expectedEndBettingState);
  });
});
