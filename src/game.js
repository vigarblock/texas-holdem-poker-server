const EventEmitter = require("events");
const _ = require("lodash");
const CardDeck = require("./cardDeck");
const Hand = require('./hand');
const PlayerService = require("./playerService");
const bettingState = require('../src/constants/bettingState');

const gameState = {
  WAITING: "WAITING",
  READYTOSTART: "READYTOSTART",
  INPROGRESS: "INPROGRESS",
};

class Game extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
    this.state = gameState.WAITING;
    this.dealer = null;
    this.minBet = 20;
    this.hand = {};

    this.playerService = new PlayerService();
  }

  startHand() {
    this.state = gameState.INPROGRESS;
    this.handInstance = new Hand();
    this.handInstance.initializeHand();
    this._initializePlayerHandsAndSetDealer();
  }

  playerAction(playerId, action, actionData) {
    const player = this.playerService.getPlayer(playerId);

    switch (this.handInstance.state) {
      case bettingState.PREFLOPBET:
        if (player.isActive) {
          const onBetAgreement = () => {
            if (this.handInstance.automaticHandWinner) {
              this._completeHand(this.handInstance.automaticHandWinner);
            } else {
              this.handInstance.setHandState(bettingState.FLOPBET);
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
            if (this.handInstance.automaticHandWinner) {
              this._completeHand(this.handInstance.automaticHandWinner);
            } else {
              this.handInstance.setHandState(bettingState.TURNBET);
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
            if (this.handInstance.automaticHandWinner) {
              this._completeHand(this.handInstance.automaticHandWinner);
            } else {
              this.handInstance.setHandState(bettingState.RIVERBET);
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
            if (this.handInstance.automaticHandWinner) {
              this._completeHand(this.handInstance.automaticHandWinner);
            } else {
              // TODO: Determine hand winner
              const handWinner = this.handInstance.betAgreedPlayers[1];
              this._completeHand(handWinner);
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

  addPlayerToGame({ id, name, playerSessionId }) {
    this.playerService.addPlayer({ id, name, playerSessionId });
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
      this.state = gameState.READYTOSTART;
    }
  }

  isReadyToStartNewHand() {
    return this.state === gameState.READYTOSTART;
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
    return this.handInstance.getCommunityCards();
  }

  getHandPot() {
    return this.handInstance.getPotTotal();
  }

  _initializePlayerHandsAndSetDealer() {
    const joinedPlayers = this.playerService.getAllPlayers();

    // Find which player is going to be the dealer
    if (!this.dealer) {
      this.dealer = _.find(joinedPlayers, (player) => player.position === 1);
    } else {
      this.dealer = this._getNextPlayer(this.dealer.position);
    }

    // Player blinds
    const smallBlindPlayer = this._getNextPlayer(this.dealer.position);
    const bigBlindPlayer = this._getNextPlayer(smallBlindPlayer.position);

    joinedPlayers.forEach((player) => {
      const playerHand = this.handInstance.getPlayerCardHand();

      let initialPlayerContribution = 0;
      const playerHandData = { playerHand, callAmount: 0, minRaiseAmount: this.minBet };

      // Set dealer and active player
      if (player.position === this.dealer.position) {
        playerHandData.isActive = true;
        playerHandData.isDealer = true;
        playerHandData.isSmallBlind = false;
      } else {
        playerHandData.isActive = false;
        playerHandData.isDealer = false;

        // Set small blind and update pot
        if (player.position === smallBlindPlayer.position) {
          playerHandData.isSmallBlind = true;
          const smallBlindBet = this.minBet/2;
          playerHandData.coins = player.coins - smallBlindBet;
          this.handInstance.addToPot(smallBlindBet);
          initialPlayerContribution = smallBlindBet;
          playerHandData.action = { name: "Small Blind", value: smallBlindBet}
        } else {
          playerHandData.isSmallBlind = false;
        }

        // Set big blind and update pot
        if (player.position === bigBlindPlayer.position) {
          playerHandData.isBigBlind = true;
          playerHandData.coins = player.coins - this.minBet;
          this.handInstance.addToPot(this.minBet);
          initialPlayerContribution = this.minBet;
          playerHandData.action = { name: "Big Blind", value: this.minBet}
        } else {
          playerHandData.isBigBlind = false;
        }
      }

      this.playerService.updatePlayer(player.id, playerHandData);
      this.handInstance.addPlayerContribution(player.id, initialPlayerContribution);
    });
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

      if (this.handInstance.doesPlayerNeedToTakeAction(nextPlayer.id)) {
        if (this.handInstance.hasEveryoneElseFolded(this.playerService.getAllPlayers().length)) {
          // Make this player the automatic winner
          this.handInstance.setAutomaticHandWinner(nextPlayer);
          this.handInstance.addToBetAgreement(nextPlayer);
          onBetAgreement();
          this.handInstance.clearBetAgreedPlayers();
          repeat = false;
        } else {
          const callAmount = this._getNextPlayersMinCallAmount(nextPlayer);
          const minRaiseAmount = this.minBet + callAmount;
          this.playerService.updatePlayer(nextPlayer.id, {
            isActive: true,
            callAmount,
            minRaiseAmount,
          });
          repeat = false;
        }
      } else {
        if (this.handInstance.havePlayersAgreedOnBet(this.playerService.getAllPlayers().length)) {
          // If all but 1 player has folded, then automatically award hand win
          if (this.handInstance.betAgreedPlayers.length === 1) {
            this.handInstance.setAutomaticHandWinner(this.handInstance.betAgreedPlayers[0]);
          }

          onBetAgreement();
          this.handInstance.clearBetAgreedPlayers();
          repeat = false;
        }

        nextPlayerCalculationPosition = nextPlayer.position;
      }
    }
  }

  _getNextPlayersMinCallAmount(nextPlayer) {
    let callAmount = 0;

    const nextPlayerContribution = this.handInstance.getPlayerContribution(nextPlayer.id);

    if (nextPlayer.coins > 0) {
      this.handInstance.playerContributions.forEach((contributor) => {
        if (
          contributor.id !== nextPlayer.id &&
          contributor.contribution > nextPlayerContribution
        ) {
          callAmount = contributor.contribution - nextPlayerContribution;
        }
      });
    }

    if (callAmount > nextPlayer.coins) {
      callAmount = nextPlayer.coins;
    }

    return callAmount;
  }

  _makePlayerActivePostBetAgreement() {
    // Find who to make active again
    let nextActivePlayer;
    const hasDealerFolded = _.find(
      this.handInstance.foldedPlayers,
      (foldedPlayer) => foldedPlayer.id === this.dealer.id
    );

    if (!hasDealerFolded) {
      nextActivePlayer = this.dealer;
    } else {
      let repeat = true;
      while (repeat) {
        const nextPlayer = this._getNextPlayer(this.dealer.position);
        const hasNextPlayerFolded = _.find(
          this.handInstance.foldedPlayers,
          (foldedPlayer) => foldedPlayer.id === nextPlayer.id
        );

        if (!hasNextPlayerFolded) {
          nextActivePlayer = nextPlayer;
          repeat = false;
        }
      }
    }

    this.playerService.updatePlayer(nextActivePlayer.id, {
      isActive: true,
      callAmount: 0,
      minRaiseAmount: this.minBet,
    });
  }

  _handlePlayerAction(player, action, actionData) {
    if (action === "check") {
      this.handInstance.addToBetAgreement(player);
      this.playerService.updatePlayer(player.id, {
        action: { name: "Checked", value: "" },
        callAmount: 0,
      });
    }

    if (action === "call") {
      const amount = parseInt(actionData);
      this.handInstance.addToPot(amount);
      this.handInstance.addPlayerContribution(player.id, amount);

      const newCoinStack = player.coins - amount;
      this.playerService.updatePlayer(player.id, {
        coins: newCoinStack,
        action: { name: "Called", value: actionData },
        callAmount: 0,
      });
      this.handInstance.addToBetAgreement(player);
    }

    if (action === "fold") {
      this.handInstance.addToFolded(player);
      this.playerService.updatePlayer(player.id, {
        action: { name: "Folded", value: "" },
      });
    }

    if (action === "raise") {
      const amount = parseInt(actionData);
      this.handInstance.addToPot(amount);
      this.handInstance.addPlayerContribution(player.id, amount);

      const newCoinStack = player.coins - amount;
      this.playerService.updatePlayer(player.id, {
        coins: newCoinStack,
        action: { name: "Raised", value: actionData },
        callAmount: 0,
      });

      // Clear all previous bet agreements
      this.handInstance.clearBetAgreedPlayers();
      this.handInstance.addToBetAgreement(player);
    }
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

  _completeHand(winningPlayer) {
    // Determine hand winner and their portion of the pot.
    // Return the remaining values if any to other players.
    const winnerId = winningPlayer.id;
    const winnerContribution = this.handInstance.getPlayerContribution(winnerId);

    let winnerCoins = winnerContribution;

    this.handInstance.playerContributions.forEach((contributor) => {
      if (contributor.id !== winnerId) {
        if (contributor.contribution > winnerContribution) {
          winnerCoins += winnerContribution;
          contributor.contribution -= winnerContribution;

          // Reimburse the remaing amount back to the player
          const contributedPlayer = this.playerService.getPlayer(
            contributor.id
          );
          const updatedPlayerCoins =
            contributedPlayer.coins + contributor.contribution;
          this.updatePlayer(player, { coins: updatedPlayerCoins });
        } else {
          winnerCoins += contributor.contribution;
          contributor.contribution = 0;
        }
      }
    });

    const winnerCoinStack = winningPlayer.coins + winnerCoins;
    this.updatePlayer(winningPlayer.id, { coins: winnerCoinStack });

    const playerData = [];

    this.handInstance.betAgreedPlayers.forEach((player) => {
      playerData.push(player);
    });

    this.handInstance.foldedPlayers.forEach((player) => {
      const foldedPlayer = Object.assign({}, player);
      foldedPlayer.playerHand = [];
      playerData.push(foldedPlayer);
    });

    const handWinnerData = {
      communityCards: this.getHandCommunityCards(),
      pot: this.handInstance.pot,
      winner: winningPlayer.name,
      playerData,
    };

    this.emit("handWinner", handWinnerData);
    this.state = gameState.WAITING;
  }
}

module.exports = Game;
