const EventEmitter = require("events");
const _ = require("lodash");
const Hand = require("./hand");
const PlayerService = require("./playerService");
const GameHasStartedError = require("./errors/gameHasStartedError");
const winDeterminer = require("../src/texas-holdem/winDeterminer");
const bettingState = require("../src/constants/bettingState");
const gameState = require("../src/constants/gameState");
const startNewHandTimeoutMs = 10000;
const gameIdleTimeoutMs = 180000;
const blindIncrement = 1.20;

class Game extends EventEmitter {
  constructor(id, minBet, startingChipsPerPlayer) {
    super();
    this.id = id;
    this.state = gameState.WAITING_FOR_GAME_START;
    this.dealer = null;
    this.activePlayerId = null;
    this.gameIdleTimeout = null;
    this.minBet = minBet;
    this.startingChipsPerPlayer = startingChipsPerPlayer;

    this.playerService = new PlayerService();
  }

  initializeGame() {
    const gamePlayers = this.playerService.getAllPlayers();
    if (gamePlayers.length < 2) {
      throw Error("At least 2 players need to join before starting a game");
    }

    this.state = gameState.GAME_STARTED;

    gamePlayers.forEach((player) => {
      this.playerService.updatePlayer(player.id, {
        coins: this.startingChipsPerPlayer,
      });
    });
  }

  startHand() {
    this.state = gameState.HAND_IN_PROGRESS;
    this.hand = new Hand();
    this.hand.initializeHand();

    this.playerService.getAllPlayers().forEach((player) => {
      if (!player.hasLost && player.coins === 0) {
        this.playerService.updatePlayer(player.id, {
          action: { name: "Lost", value: "" },
          hasLost: true,
        });
      } else if (!player.hasLeft && !player.hasLost) {
        this.playerService.updatePlayer(player.id, {
          action: { name: "Ready", value: "" },
          callAmount: 0,
        });
      }
    });

    this._initializePlayerHandsAndSetDealer();
  }

  _initializePlayerHandsAndSetDealer() {
    const joinedPlayers = this.playerService.getAllPlayers();

    if (!this.dealer) {
      this.dealer = _.find(joinedPlayers, (player) => player.position === 1);
    } else {
      this.dealer = this._getNextPlayer(this.dealer.position);
    }

    const smallBlindPlayer = this._getNextPlayer(this.dealer.position);
    const bigBlindPlayer = this._getNextPlayer(smallBlindPlayer.position);
    const firstActivePlayer = this._getNextPlayer(bigBlindPlayer.position);

    // Set up hand blinds
    joinedPlayers.forEach((player) => {
      if (!player.hasLost || !player.hasLeft) {
        const playerData = {
          isActive: false,
          isDealer: false,
          isBigBlind: false,
          isSmallBlind: false,
          callAmount: 0,
          minRaiseAmount: this.minBet,
          playerHand: this.hand.getPlayerCardHand(),
        };

        if (player.position === this.dealer.position) {
          playerData.isDealer = true;
        }

        if (player.position === smallBlindPlayer.position) {
          playerData.isSmallBlind = true;

          const smallBlindBet = this.minBet / 2;
          playerData.coins = player.coins - smallBlindBet;
          this.hand.addToPot(smallBlindBet);
          this.hand.addPlayerContribution(player.id, smallBlindBet);
          playerData.action = { name: "Small Blind", value: smallBlindBet };
        }

        if (player.position === bigBlindPlayer.position) {
          playerData.isBigBlind = true;
          playerData.coins = player.coins - this.minBet;
          this.hand.addToPot(this.minBet);
          this.hand.addPlayerContribution(player.id, this.minBet);
          playerData.action = { name: "Big Blind", value: this.minBet };
        }

        this.playerService.updatePlayer(player.id, playerData);
      }
    });

    // Once blinds have been set up, update the first active player
    this.activePlayerId = firstActivePlayer.id;
    this.playerService.updatePlayer(firstActivePlayer.id, {
      isActive: true,
      callAmount: this.hand.getMinCallAmount(
        firstActivePlayer.id,
        firstActivePlayer.coins
      ),
    });
  }

  playerAction(playerId, action, actionData, internalRequest) {
    if(!internalRequest && playerId !== this.activePlayerId) {
      console.error(`Received a response from an unexpected player - ${playerId} - action ${action}`);
      return;
    }

    console.info(`Processing player - ${playerId} - action ${action}`);

    this.state = gameState.HAND_IN_PROGRESS;

    const player = this.playerService.getPlayer(playerId);

    switch (this.hand.state) {
      case bettingState.PREFLOPBET:
        const onPreFlopAgreement = () => {
          if (this.hand.automaticHandWinner) {
            this._completeHand(
              this.hand.automaticHandWinner,
              "Automatic Winner"
            );
          } else {
            this.hand.setHandState(bettingState.FLOPBET);
            this._makePlayerActivePostBetAgreement();
          }
        };

        this._handlePlayerAction(player, action, actionData);
        this._determineBetAgreement(player, onPreFlopAgreement);
        break;

      case bettingState.FLOPBET:
        const onFlopAgreement = () => {
          if (this.hand.automaticHandWinner) {
            this._completeHand(
              this.hand.automaticHandWinner,
              "Automatic Winner"
            );
          } else {
            this.hand.setHandState(bettingState.TURNBET);
            this._makePlayerActivePostBetAgreement();
          }
        };

        this._handlePlayerAction(player, action, actionData);
        this._determineBetAgreement(player, onFlopAgreement);
        break;

      case bettingState.TURNBET:
        const onTurnAgreement = () => {
          if (this.hand.automaticHandWinner) {
            this._completeHand(
              this.hand.automaticHandWinner,
              "Automatic Winner"
            );
          } else {
            this.hand.setHandState(bettingState.RIVERBET);
            this._makePlayerActivePostBetAgreement();
          }
        };

        this._handlePlayerAction(player, action, actionData);
        this._determineBetAgreement(player, onTurnAgreement);
        break;

      case bettingState.RIVERBET:
        const onRiverAgreement = () => {
          if (this.hand.automaticHandWinner) {
            this._completeHand(
              this.hand.automaticHandWinner,
              "Automatic Winner"
            );
          } else {
            const winResult = winDeterminer.getWinners(
              this.hand.betAgreedPlayers,
              this.hand.getCommunityCards()
            );
            this._completeHand(
              winResult.winners[0],
              winResult.winningRankMessage
            );
          }
        };

        this._handlePlayerAction(player, action, actionData);
        this._determineBetAgreement(player, onRiverAgreement);
        break;

      default:
        break;
    }
  }

  addPlayerToGame({ id, name, socketId }) {
    const playerExists = this.playerService.getPlayer(id);

    if (!playerExists && this.state !== gameState.WAITING_FOR_GAME_START) {
      throw new GameHasStartedError(
        "You cannot join a game that has already started"
      );
    }

    this.playerService.addPlayer({ id, name, socketId });
  }

  hasGameStarted() {
    return this.state !== gameState.WAITING_FOR_GAME_START;
  }

  hasHandEnded() {
    return this.state === gameState.HAND_ENDED;
  }

  updatePlayer(playerId, playerData) {
    this.playerService.updatePlayer(playerId, playerData);
  }

  removePlayer(playerId) {
    if (this.hand) {
      this.hand.addToExited(playerId);
      this.playerAction(playerId, "fold", null, true);
    }

    this.playerService.updatePlayer(playerId, {
      action: { name: "Left" },
      hasLeft: true,
    });
  }

  getPlayer(playerId) {
    return this.playerService.getPlayer(playerId);
  }

  getAllPlayers() {
    return this.playerService.getAllPlayers();
  }

  getOpponentPlayers(playerId) {
    return this.playerService.getOpponentPlayers(playerId);
  }

  getHandCommunityCards() {
    return this.hand.getCommunityCards();
  }

  getHandPot() {
    return this.hand.getPotTotal();
  }

  getActivePlayerCount() {
    const allPlayers = this.getAllPlayers();
    const activePlayers = allPlayers.filter(
      (p) => p.hasLeft === false && p.hasLost === false
    );
    return activePlayers.length;
  }

  _getNextPlayer(currentPlayerPosition) {
    const allPlayers = this.getAllPlayers();
    const remainingEligiblePlayers = allPlayers.filter(
      (p) => p.hasLeft === false && p.hasLost === false
    );

    const sortedPlayerPositions = _.sortBy(remainingEligiblePlayers, [
      "position",
    ]);

    const currentPlayerIndex = sortedPlayerPositions.findIndex(
      (s) => s.position === currentPlayerPosition
    );

    let nextPlayerIndex;

    if (currentPlayerIndex === sortedPlayerPositions.length - 1) {
      nextPlayerIndex = 0;
    } else {
      nextPlayerIndex = currentPlayerIndex + 1;
    }

    const nextPlayerId = sortedPlayerPositions[nextPlayerIndex].id;

    return this.playerService
      .getAllPlayers()
      .find((p) => p.id === nextPlayerId);
  }

  _determineBetAgreement(player, onBetAgreement) {
    console.info('Attempting to determine bet agreement on action for player - ', player);
    // Make the current player inactive
    this.playerService.updatePlayer(player.id, {
      isActive: false,
      callAmount: 0,
    });

    // If bet agreement has been reached, execute callback and return.
    if (this.hand.havePlayersAgreedOnBet(this.getActivePlayerCount())) {
      if (this.hand.hasEveryoneElseFolded(this.getActivePlayerCount())) {
        this.hand.setAutomaticHandWinner(this.hand.betAgreedPlayers[0]);
      }

      onBetAgreement();
      this.hand.clearBetAgreedPlayers();
      return;
    }

    // No agreement  yet, determine who needs to act next.
    let currentPosition = player.position;
    for (let i = 0; i < this.getActivePlayerCount() - 1; i++) {
      // Get next player
      const nextPlayer = this._getNextPlayer(currentPosition);

      // Check if player needs to act
      if (this.hand.doesPlayerNeedToTakeAction(nextPlayer.id)) {
        // If everyone has folded, player does not really need to act
        if (this.hand.hasEveryoneElseFolded(this.getActivePlayerCount())) {
          this.hand.setAutomaticHandWinner(nextPlayer);
          this.hand.addToBetAgreement(nextPlayer);
          onBetAgreement();
          this.hand.clearBetAgreedPlayers();
          return;
        } else {
          // Determine call values and make player active
          const callAmount = this.hand.getMinCallAmount(
            nextPlayer.id,
            nextPlayer.coins
          );

          let minRaiseAmount = 0;
          if (nextPlayer.coins > this.minBet + callAmount) {
            minRaiseAmount = this.minBet + callAmount;
          } else if (nextPlayer.coins > callAmount) {
            minRaiseAmount = nextPlayer.coins;
          }

          this.playerService.updatePlayer(nextPlayer.id, {
            isActive: true,
            callAmount,
            minRaiseAmount,
          });
          this.activePlayerId = nextPlayer.id;
          return;
        }
      }

      currentPosition = nextPlayer.position;
    }

    throw new Error('Failed to determine bet agreement.');
  }

  _makePlayerActivePostBetAgreement() {
    //  Game Rule: The next active player to the left(next position)
    //  of the dealer is first to decide after first bet agreement.
    let nextActivePlayer;
    let position = this.dealer.position;

    let repeat = true;
    while (repeat) {
      const nextPlayer = this._getNextPlayer(position);
      const hasNextPlayerFolded = this.hand.hasPlayerFolded(nextPlayer.id);

      if (!hasNextPlayerFolded) {
        nextActivePlayer = nextPlayer;
        repeat = false;
      } else {
        position = nextPlayer.position;
      }
    }

    this.playerService.updatePlayer(nextActivePlayer.id, {
      isActive: true,
      callAmount: 0,
      minRaiseAmount: this.minBet,
    });
    this.activePlayerId = nextActivePlayer.id;
  }

  _handlePlayerAction(player, action, actionData) {
    if (action === "check") {
      this.hand.addToBetAgreement(player);
      this.playerService.updatePlayer(player.id, {
        action: { name: "Checked", value: "" },
        callAmount: 0,
      });
    }

    if (action === "call") {
      const amount = parseInt(actionData);
      this.hand.addToPot(amount);
      this.hand.addPlayerContribution(player.id, amount);

      const newCoinStack = amount > player.coins ? 0 : player.coins - amount;
      this.playerService.updatePlayer(player.id, {
        coins: newCoinStack,
        action: { name: "Called", value: actionData },
        callAmount: 0,
      });
      this.hand.addToBetAgreement(player);
    }

    if (action === "fold") {
      this.hand.addToFolded(player);
      this.playerService.updatePlayer(player.id, {
        action: { name: "Folded", value: "" },
      });
    }

    if (action === "raise") {
      const amount = parseInt(actionData);
      this.hand.addToPot(amount);
      this.hand.addPlayerContribution(player.id, amount);

      const newCoinStack = amount > player.coins ? 0 : player.coins - amount;
      this.playerService.updatePlayer(player.id, {
        coins: newCoinStack,
        action: { name: "Raised", value: actionData },
        callAmount: 0,
      });

      // Clear all previous bet agreements
      this.hand.clearBetAgreedPlayers();
      this.hand.addToBetAgreement(player);
    }
  }

  startGameIdleTime() {
    this.gameIdleTimeout = setTimeout(() => {
      this._emitGameIdleTimeout();
    }, gameIdleTimeoutMs);
  }

  stopGameIdleTime() {
    clearTimeout(this.gameIdleTimeout);
  }

  _shouldGameEnd() {
    const allActivePlayers = this.playerService
      .getAllPlayers()
      .filter((p) => p.hasLeft === false && p.hasLost === false);

    const lostPlayers = [];
    _.find(allActivePlayers, (player) => {
      if (player.coins === 0) {
        lostPlayers.push(player);
      }
    });

    return lostPlayers.length === allActivePlayers.length - 1;
  }

  _getGameWinner() {
    const allPlayers = this.playerService.getAllPlayers();

    const winner = [];

    _.find(allPlayers, (player) => {
      if (player.coins !== 0) {
        winner.push(player);
      }
    });

    return winner[0];
  }

  _completeHand(handWinner, winExplanation) {
    const hand = this.hand.completeHand(handWinner.id);
    const winningPlayer = this.getPlayer(handWinner.id);

    // Update winner
    this.updatePlayer(winningPlayer.id, {
      coins: winningPlayer.coins + hand.winnerAmount,
    });

    // Update reimbursments
    hand.playersToBeReimbursed.forEach((p) => {
      const contributedPlayer = this.playerService.getPlayer(p.id);
      this.updatePlayer(p.id, {
        coins: contributedPlayer.coins + p.reimbursment,
      });
    });

    const handWinnerData = {
      communityCards: hand.communityCards,
      pot: hand.pot,
      winnerId: winningPlayer.id,
      winner: winningPlayer.name,
      winExplanation,
      winnerAmount: hand.winnerAmount,
      playerData: hand.playerData,
    };

    if (this._shouldGameEnd()) {
      handWinnerData.gameWon = true;
      handWinnerData.gameWinner = this._getGameWinner();
      this._emitHandWinner(handWinnerData);
    } else {
      this._emitHandWinner(handWinnerData);
      setTimeout(() => {
        this.minBet = Math.round(this.minBet * blindIncrement);
        this.startHand();
        this.emitPlayerUpdates();
        this.emitCommunityUpdates();
      }, startNewHandTimeoutMs);
    }

    this.state = gameState.HAND_ENDED;
  }

  _emitHandWinner(data) {
    this.emit("handWinner", data);
  }

  _emitGameIdleTimeout() {
    this.emit("idleTimeout");
  }

  emitPlayerUpdates(lastPerformedAction) {
    const playerUpdates = [];

    this.playerService.getAllPlayers().forEach((player) => {
      if (this.state !== gameState.WAITING_FOR_GAME_START) {
        player.betContribution = this.hand.getPlayerHandStateContribution(
          player.id
        );
      }

      const playerUpdate = {
        socketId: player.socketId,
        playerData: player,
        opponentsData: null,
      };

      const opponentsData = this.playerService.getOpponentPlayers(player.id);

      if (opponentsData.length > 0) {
        if (this.state !== gameState.WAITING_FOR_GAME_START) {
          opponentsData.forEach((o) => {
            o.betContribution = this.hand.getPlayerHandStateContribution(o.id);
          });
        }

        playerUpdate.opponentsData = opponentsData;
      }

      playerUpdates.push(playerUpdate);
    });

    const playerUpdatesData = {
      timeStamp: Date.now(),
      updates: playerUpdates,
      lastPerformedAction,
    };
    this.emit("playerUpdates", playerUpdatesData);
  }

  emitCommunityUpdates() {
    const communityUpdates = {
      communityCards: this.getHandCommunityCards(),
      pot: this.getHandPot(),
    };

    this.emit("communityUpdates", communityUpdates);
  }
}

module.exports = Game;
