const EventEmitter = require("events");
const _ = require("lodash");
const CardDeck = require("./cardDeck");
const Hand = require("./hand");
const PlayerService = require("./playerService");
const bettingState = require("../src/constants/bettingState");

const gameState = {
  WAITING: "WAITING",
  READYTOSTART: "READYTOSTART",
  INPROGRESS: "INPROGRESS",
  WAITINGFORPLAYER: "WAITINGFORPLAYER",
};

class Game extends EventEmitter {
  constructor(id, startingChipsPerPlayer) {
    super();
    this.id = id;
    this.state = gameState.WAITING;
    this.dealer = null;
    this.minBet = 20;
    this.startingChipsPerPlayer = startingChipsPerPlayer;

    this.playerService = new PlayerService();
  }

  initializeGame() {
    const gamePlayers = this.playerService.getAllPlayers();
    if (gamePlayers.length < 2) {
      throw Error("At least 2 players need to join before starting a game");
    }

    gamePlayers.forEach((player) => {
      this.playerService.updatePlayer(player.id, { coins: this.startingChipsPerPlayer });
    });
  }

  startHand() {
    this.state = gameState.INPROGRESS;
    this.handInstance = new Hand();
    this.handInstance.initializeHand();
    this._initializePlayerHandsAndSetDealer();
  }

  playerAction(playerId, action, actionData) {
    this.state = gameState.INPROGRESS;
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
        playerHand: this.handInstance.getPlayerCardHand(),
      };

      let initialPlayerContribution = 0;

      if (player.position === this.dealer.position) {
        playerData.isDealer = true;
      }

      if (player.position === smallBlindPlayer.position) {
        playerData.isSmallBlind = true;

        const smallBlindBet = this.minBet / 2;
        playerData.coins = player.coins - smallBlindBet;
        this.handInstance.addToPot(smallBlindBet);
        initialPlayerContribution = smallBlindBet;
        playerData.action = { name: "Small Blind", value: smallBlindBet };
      }

      if (player.position === bigBlindPlayer.position) {
        playerData.isBigBlind = true;
        playerData.coins = player.coins - this.minBet;
        this.handInstance.addToPot(this.minBet);
        initialPlayerContribution = this.minBet;
        playerData.action = { name: "Big Blind", value: this.minBet };
      }

      if (player.position === firstActivePlayer.position) {
        playerData.isActive = true;
        playerData.callAmount = this.minBet;
      }

      this.playerService.updatePlayer(player.id, playerData);
      this.handInstance.addPlayerContribution(
        player.id,
        initialPlayerContribution
      );
    });

    this.state = gameState.WAITINGFORPLAYER;
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
        if (
          this.handInstance.hasEveryoneElseFolded(
            this.playerService.getAllPlayers().length
          )
        ) {
          // Make this player the automatic winner
          this.handInstance.setAutomaticHandWinner(nextPlayer);
          this.handInstance.addToBetAgreement(nextPlayer);
          onBetAgreement();
          this.handInstance.clearBetAgreedPlayers();
          repeat = false;
        } else {
          const callAmount = this.handInstance.getMinCallAmount(
            nextPlayer.id,
            nextPlayer.coins
          );
          const minRaiseAmount = this.minBet + callAmount;
          this.playerService.updatePlayer(nextPlayer.id, {
            isActive: true,
            callAmount,
            minRaiseAmount,
          });
          repeat = false;
        }
      } else {
        if (
          this.handInstance.havePlayersAgreedOnBet(
            this.playerService.getAllPlayers().length
          )
        ) {
          // If all but 1 player has folded, then automatically award hand win
          if (this.handInstance.betAgreedPlayers.length === 1) {
            this.handInstance.setAutomaticHandWinner(
              this.handInstance.betAgreedPlayers[0]
            );
          }

          onBetAgreement();
          this.handInstance.clearBetAgreedPlayers();
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
      const hasNextPlayerFolded = this.handInstance.hasPlayerFolded(
        nextPlayer.id
      );

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
    const hand = this.handInstance.completeHand(winningPlayer.id);

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
      winnerAmount: hand.winnerAmount,
      playerData: hand.playerData,
    };

    this.emit("handWinner", handWinnerData);
    this.state = gameState.WAITING;
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
