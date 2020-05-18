const EventEmitter = require("events");
const _ = require("lodash");
const Hand = require("./hand");
const PlayerService = require("./playerService");
const winDeterminer = require("../src/texas-holdem/winDeterminer");
const bettingState = require("../src/constants/bettingState");
const gameState = require("../src/constants/gameState");
const playerWaitTimeoutMs = 30000;

class Game extends EventEmitter {
  constructor(id, startingChipsPerPlayer) {
    super();
    this.id = id;
    this.state = gameState.WAITING_FOR_GAME_START;
    this.dealer = null;
    this.activePlayerId = null;
    this.waitingForPlayerResponse = null;
    this.minBet = 20;
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

    joinedPlayers.forEach((player) => {
      const playerData = {
        isActive: false,
        isDealer: false,
        isBigBlind: false,
        isSmallBlind: false,
        callAmount: 0,
        minRaiseAmount: this.minBet,
        playerHand: this.hand.getPlayerCardHand(),
      };

      let initialPlayerContribution = 0;

      if (player.position === this.dealer.position) {
        playerData.isDealer = true;
      }

      if (player.position === smallBlindPlayer.position) {
        playerData.isSmallBlind = true;

        const smallBlindBet = this.minBet / 2;
        playerData.coins = player.coins - smallBlindBet;
        this.hand.addToPot(smallBlindBet);
        initialPlayerContribution = smallBlindBet;
        playerData.action = { name: "Small Blind", value: smallBlindBet };
      }

      if (player.position === bigBlindPlayer.position) {
        playerData.isBigBlind = true;
        playerData.coins = player.coins - this.minBet;
        this.hand.addToPot(this.minBet);
        initialPlayerContribution = this.minBet;
        playerData.action = { name: "Big Blind", value: this.minBet };
      }

      if (player.position === firstActivePlayer.position) {
        this.activePlayerId = player.id;
        playerData.isActive = true;
        playerData.callAmount = this.minBet;
      }

      this.playerService.updatePlayer(player.id, playerData);
      this.hand.addPlayerContribution(player.id, initialPlayerContribution);
    });

    this.waitingForPlayerResponse = this.startWaitingForPlayerResponse();
  }

  playerAction(playerId, action, actionData) {
    this.state = gameState.HAND_IN_PROGRESS;
    this.stopWaitingForPlayerResponse();

    const player = this.playerService.getPlayer(playerId);

    switch (this.hand.state) {
      case bettingState.PREFLOPBET:
        if (player.isActive) {
          const onBetAgreement = () => {
            if (this.hand.automaticHandWinner) {
              this._completeHand(this.hand.automaticHandWinner, "Automatic Winner");
            } else {
              this.hand.setHandState(bettingState.FLOPBET);
              this._makePlayerActivePostBetAgreement();
            }
          };

          this._handlePlayerAction(player, action, actionData);
          this._determineBetAgreement(player, onBetAgreement);
        } else {
          throw Error(`Player '${player.name}' performed an illegal action`);
        }
        break;

      case bettingState.FLOPBET:
        if (player.isActive) {
          const onBetAgreement = () => {
            if (this.hand.automaticHandWinner) {
              this._completeHand(this.hand.automaticHandWinner, "Automatic Winner");
            } else {
              this.hand.setHandState(bettingState.TURNBET);
              this._makePlayerActivePostBetAgreement();
            }
          };

          this._handlePlayerAction(player, action, actionData);
          this._determineBetAgreement(player, onBetAgreement);
        } else {
          throw Error(`Player '${player.name}' performed an illegal action`);
        }
        break;

      case bettingState.TURNBET:
        if (player.isActive) {
          const onBetAgreement = () => {
            if (this.hand.automaticHandWinner) {
              this._completeHand(this.hand.automaticHandWinner, "Automatic Winner");
            } else {
              this.hand.setHandState(bettingState.RIVERBET);
              this._makePlayerActivePostBetAgreement();
            }
          };

          this._handlePlayerAction(player, action, actionData);
          this._determineBetAgreement(player, onBetAgreement);
        } else {
          throw Error(`Player '${player.name}' performed an illegal action`);
        }
        break;

      case bettingState.RIVERBET:
        if (player.isActive) {
          const onBetAgreement = () => {
            if (this.hand.automaticHandWinner) {
              this._completeHand(this.hand.automaticHandWinner, "Automatic Winner");
            } else {
              const winResult = winDeterminer.getWinners(
                this.hand.betAgreedPlayers,
                this.hand.getCommunityCards()
              );
              this._completeHand(winResult.winners[0], winResult.winningRankMessage);
            }

            if (this._shouldGameEnd()) {
              const gameWinner = this._getGameWinner();
              this.emit("gameWinner", gameWinner);
            }
          };

          this._handlePlayerAction(player, action, actionData);
          this._determineBetAgreement(player, onBetAgreement);
        } else {
          throw Error(`Player '${player.name}' performed an illegal action`);
        }
        break;

      default:
        break;
    }
  }

  addPlayerToGame({ id, name, socketId }) {
    this.playerService.addPlayer({ id, name, socketId });
  }

  playerContinue(playerId) {
    this.playerService.updatePlayer(playerId, {
      action: { name: "Joined", value: "" },
      callAmount: 0,
    });

    const playersWaitingToJoin = _.find(
      this.playerService.getAllPlayers(),
      (player) => player.action.name !== "Joined"
    );

    if (!playersWaitingToJoin) {
      this.state = gameState.READY_TO_START_HAND;
    }
  }

  isReadyToStartNewHand() {
    return this.state === gameState.READY_TO_START_HAND;
  }

  hasGameStarted() {
    return this.state !== gameState.WAITING_FOR_GAME_START;
  }

  updatePlayer(playerId, playerData) {
    this.playerService.updatePlayer(playerId, playerData);
  }

  removePlayer(playerId) {
    this.playerService.removePlayer(playerId);
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

  _getNextPlayer(currentPlayerPosition) {
    // Get next player position based on index
    let nextPlayerPosition = currentPlayerPosition + 1;
    if (nextPlayerPosition > this.playerService.getAllPlayers().length) {
      nextPlayerPosition = 1;
    }

    const nextPlayer = this.playerService.getPlayerByPosition(
      nextPlayerPosition
    );

    return nextPlayer;
  }

  _determineBetAgreement(player, onBetAgreement) {
    // Make the current player inactive
    this.playerService.updatePlayer(player.id, {
      isActive: false,
      callAmount: 0,
    });

    // Determine if another player needs to made active or the bet is settled
    let repeat = true;
    let nextPlayerCalculationPosition = player.position;
    while (repeat) {
      const nextPlayer = this._getNextPlayer(nextPlayerCalculationPosition);

      if (this.hand.doesPlayerNeedToTakeAction(nextPlayer.id)) {
        if (
          this.hand.hasEveryoneElseFolded(
            this.playerService.getAllPlayers().length
          )
        ) {
          // Make this player the automatic winner
          this.hand.setAutomaticHandWinner(nextPlayer);
          this.hand.addToBetAgreement(nextPlayer);
          onBetAgreement();
          this.hand.clearBetAgreedPlayers();
          repeat = false;
        } else {
          const callAmount = this.hand.getMinCallAmount(
            nextPlayer.id,
            nextPlayer.coins
          );
          const minRaiseAmount = this.minBet + callAmount;
          this.playerService.updatePlayer(nextPlayer.id, {
            isActive: true,
            callAmount,
            minRaiseAmount,
          });
          this.activePlayerId = nextPlayer.id;
          this.waitingForPlayerResponse = this.startWaitingForPlayerResponse();
          repeat = false;
        }
      } else {
        if (
          this.hand.havePlayersAgreedOnBet(
            this.playerService.getAllPlayers().length
          )
        ) {
          // If all but 1 player has folded, then automatically award hand win
          if (this.hand.betAgreedPlayers.length === 1) {
            this.hand.setAutomaticHandWinner(this.hand.betAgreedPlayers[0]);
          }

          onBetAgreement();
          this.hand.clearBetAgreedPlayers();
          repeat = false;
        }

        nextPlayerCalculationPosition = nextPlayer.position;
      }
    }
  }

  _makePlayerActivePostBetAgreement() {
    //  Game Rule: The next active player to the left(next position)
    //  of the dealer is first to decide after first bet agreement.
    let nextActivePlayer;

    let repeat = true;
    while (repeat) {
      const nextPlayer = this._getNextPlayer(this.dealer.position);
      const hasNextPlayerFolded = this.hand.hasPlayerFolded(nextPlayer.id);

      if (!hasNextPlayerFolded) {
        nextActivePlayer = nextPlayer;
        repeat = false;
      }
    }

    this.playerService.updatePlayer(nextActivePlayer.id, {
      isActive: true,
      callAmount: 0,
      minRaiseAmount: this.minBet,
    });
    this.activePlayerId = nextActivePlayer.id;
    this.waitingForPlayerResponse = this.startWaitingForPlayerResponse();
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

      const newCoinStack = player.coins - amount;
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

      const newCoinStack = player.coins - amount;
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

  startWaitingForPlayerResponse() {
    this.state = gameState.WAITING_FOR_PLAYER;
    const timeout = setTimeout(
      (playerId) => {
        if (
          this.state === gameState.WAITING_FOR_PLAYER &&
          playerId === this.activePlayerId
        ) {
          this.playerAction(this.activePlayerId, "fold", null);
          this.emitPlayerUpdates();
          this.emitCommunityUpdates();
        }
      },
      playerWaitTimeoutMs,
      this.activePlayerId
    );

    return timeout;
  }

  stopWaitingForPlayerResponse() {
    this.activePlayerId = null;
    clearTimeout(this.waitingForPlayerResponse);
    this.waitingForPlayerResponse = null;
  }

  _shouldGameEnd() {
    const allPlayers = this.playerService.getAllPlayers();

    const lostPlayers = [];
    _.find(allPlayers, (player) => {
      if (player.coins === 0) {
        lostPlayers.push(player);
      }
    });

    return lostPlayers.length === allPlayers.length - 1;
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
      winner: winningPlayer.name,
      winExplanation,
      winnerAmount: hand.winnerAmount,
      playerData: hand.playerData,
    };

    this.emit("handWinner", handWinnerData);
    this.state = gameState.HAND_ENDED;
  }

  emitPlayerUpdates() {
    const playerUpdates = [];

    this.playerService.getAllPlayers().forEach((player) => {
      const playerUpdate = {
        socketId: player.socketId,
        playerData: player,
        opponentsData: null,
      };

      const opponentsData = this.playerService.getOpponentPlayers(player.id);

      if (opponentsData.length > 0) {
        playerUpdate.opponentsData = opponentsData;
      }

      playerUpdates.push(playerUpdate);
    });

    this.emit("playerUpdates", playerUpdates);
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
