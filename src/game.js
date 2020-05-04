const EventEmitter = require("events");
const _ = require("lodash");
const CardDeck = require("./cardDeck");
const PlayerService = require("./playerService");

const gameState = {
  WAITING: "WAITING",
  READYTOSTART: "READYTOSTART",
  INPROGRESS: "INPROGRESS",
};

const bettingState = {
  PREFLOPBET: "PREFLOPBET",
  FLOPBET: "FLOPBET",
  TURNBET: "TURNBET",
  RIVERBET: "RIVERBET",
};

class Game extends EventEmitter {
  constructor() {
    super();
    this.name = "my-first-game";
    this.state = gameState.WAITING;
    this.dealer = null;
    this.minBet = 20;
    this.hand = {};

    this.playerService = new PlayerService();
  }

  startHand() {
    this.state = gameState.INPROGRESS;

    this.hand = {
      state: bettingState.PREFLOPBET,
      communityCards: [],
      cardDeck: new CardDeck(),
      playerContributions: [],
      foldedPlayers: [],
      betAgreedPlayers: [],
      pot: 0,
      automaticHandWinner: null,
    };

    this.hand.cardDeck.shuffle();
    this._initializePlayerHandsAndSetDealer();
  }

  playerAction(playerId, action, actionData) {
    const player = this.playerService.getPlayer(playerId);

    switch (this.hand.state) {
      case bettingState.PREFLOPBET:
        if (player.isActive) {
          const onBetAgreement = () => {
            if (this.hand.automaticHandWinner) {
              this._completeHand(this.hand.automaticHandWinner);
            } else {
              this.hand.state = bettingState.FLOPBET;
              const flopCards = this.hand.cardDeck.takeCards(3);
              this.hand.communityCards = [...flopCards];
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
              this._completeHand(this.hand.automaticHandWinner);
            } else {
              this.hand.state = bettingState.TURNBET;
              const [turnCard] = this.hand.cardDeck.takeCards(1);
              this.hand.communityCards.push(turnCard);
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
              this._completeHand(this.hand.automaticHandWinner);
            } else {
              this.hand.state = bettingState.RIVERBET;
              const [riverCard] = this.hand.cardDeck.takeCards(1);
              this.hand.communityCards.push(riverCard);
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
              this._completeHand(this.hand.automaticHandWinner);
            } else {
              // TODO: Determine hand winner
              const handWinner = this.hand.betAgreedPlayers[1];
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

  addPlayerToGame({ id, name }) {
    this.playerService.addPlayer({ id, name });
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
    return [...this.hand.communityCards];
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
      const cards = this.hand.cardDeck.takeCards(2);

      const playerHand = [
        { suit: cards[0].suit, cardValue: cards[0].value },
        { suit: cards[1].suit, cardValue: cards[1].value },
      ];

      const playerHandData = { playerHand, callAmount: 0 };

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
          playerHandData.coins = player.coins - this.minBet;
          this.hand.pot += this.minBet;
        } else {
          playerHandData.isSmallBlind = false;
        }

        // Set big blind and update pot
        if (player.position === bigBlindPlayer.position) {
          playerHandData.isBigBlind = true;
          const bigBlindBet = this.minBet * 2;
          playerHandData.coins = player.coins - bigBlindBet;
          this.hand.pot += bigBlindBet;
        } else {
          playerHandData.isBigBlind = false;
        }
      }

      this.playerService.updatePlayer(player.id, playerHandData);
      this.hand.playerContributions.push({ id: player.id, contribution: 0 });
    });
  }

  _haveAllPlayersAgreedOnBet() {
    const totalPlayers =
      this.hand.foldedPlayers.length + this.hand.betAgreedPlayers.length;

    return totalPlayers === this.playerService.getAllPlayers().length;
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

  _doesPlayerNeedToTakeAction(player) {
    const isInBetList = _.find(
      this.hand.betAgreedPlayers,
      (p) => p.id === player.id
    );
    const isInFoldedList = _.find(
      this.hand.foldedPlayers,
      (p) => p.id === player.id
    );

    return !isInBetList && !isInFoldedList;
  }

  _hasEveryoneElseFolded() {
    // Does player have a viable option as action
    const totalPlayers = this.playerService.getAllPlayers().length;
    const foldedPlayers = this.hand.foldedPlayers.length;
    return totalPlayers - foldedPlayers === 1;
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

      if (this._doesPlayerNeedToTakeAction(nextPlayer)) {
        if (this._hasEveryoneElseFolded()) {
          // Make this player the automatic winner
          this.hand.automaticHandWinner = nextPlayer;
          this.hand.betAgreedPlayers.push(nextPlayer);
          onBetAgreement();
          this.hand.betAgreedPlayers = [];
          repeat = false;
        } else {
          const callAmount = this._getNextPlayersMinCallAmount(nextPlayer);
          this.playerService.updatePlayer(nextPlayer.id, {
            isActive: true,
            callAmount,
          });
          repeat = false;
        }
      } else {
        if (this._haveAllPlayersAgreedOnBet()) {
          // If all but 1 player has folded, then automatically award hand win
          if (this.hand.betAgreedPlayers.length === 1) {
            this.hand.automaticHandWinner = this.hand.betAgreedPlayers[0];
          }

          onBetAgreement();
          this.hand.betAgreedPlayers = [];
          repeat = false;
        }

        nextPlayerCalculationPosition = nextPlayer.position;
      }
    }
  }

  _getNextPlayersMinCallAmount(nextPlayer) {
    let callAmount = 0;

    console.log(this.hand.playerContributions);

    const nextPlayerContribution = _.find(
      this.hand.playerContributions,
      (contributor) => contributor.id === nextPlayer.id
    ).contribution;

    if (nextPlayer.coins > 0) {
      this.hand.playerContributions.forEach((contributor) => {
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
      this.hand.foldedPlayers,
      (foldedPlayer) => foldedPlayer.id === this.dealer.id
    );

    if (!hasDealerFolded) {
      nextActivePlayer = this.dealer;
    } else {
      let repeat = true;
      while (repeat) {
        const nextPlayer = this._getNextPlayer(this.dealer.position);
        const hasNextPlayerFolded = _.find(
          this.hand.foldedPlayers,
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
    });
  }

  _handlePlayerAction(player, action, actionData) {
    if (action === "check") {
      this.hand.betAgreedPlayers.push(player);
      this.playerService.updatePlayer(player.id, {
        action: { name: "Checked", value: "" },
        callAmount: 0,
      });
    }

    if (action === "call") {
      const amount = parseInt(actionData);
      this.hand.pot += amount;

      this.hand.playerContributions.forEach((contributor) => {
        if (contributor.id === player.id) {
          contributor.contribution += amount;
        }
      });

      const newCoinStack = player.coins - amount;
      this.playerService.updatePlayer(player.id, {
        coins: newCoinStack,
        action: { name: "Called", value: actionData },
        callAmount: 0,
      });
      this.hand.betAgreedPlayers.push(player);
    }

    if (action === "fold") {
      this.hand.foldedPlayers.push(player);
      this.playerService.updatePlayer(player.id, {
        action: { name: "Folded", value: "" },
      });
    }

    if (action === "raise") {
      const amount = parseInt(actionData);
      this.hand.pot += amount;
      this.hand.playerContributions.forEach((contributor) => {
        if (contributor.id === player.id) {
          contributor.contribution += amount;
        }
      });

      const newCoinStack = player.coins - amount;
      this.playerService.updatePlayer(player.id, {
        coins: newCoinStack,
        action: { name: "Raised", value: actionData },
        callAmount: 0,
      });

      // Clear all previous bet agreements
      this.hand.betAgreedPlayers = [];
      this.hand.betAgreedPlayers.push(player);
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
    console.log("Hand Completed", this.hand);

    // Determine hand winner and their portion of the pot.
    // Return the remaining values if any to other players.
    const winnerId = winningPlayer.id;
    const winnerContribution = _.find(
      this.hand.playerContributions,
      (contributor) => contributor.id === winnerId
    ).contribution;

    let winnerCoins = winnerContribution;

    this.hand.playerContributions.forEach((contributor) => {
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

    this.hand.betAgreedPlayers.forEach((player) => {
      playerData.push(player);
    });

    this.hand.foldedPlayers.forEach((player) => {
      const foldedPlayer = Object.assign({}, player);
      foldedPlayer.playerHand = [];
      playerData.push(foldedPlayer);
    });

    const handWinnerData = {
      communityCards: this.getHandCommunityCards(),
      pot: this.hand.pot,
      winner: winningPlayer.name,
      playerData,
    };

    this.emit("handWinner", handWinnerData);
    this.state = gameState.WAITING;
  }
}

module.exports = new Game();
