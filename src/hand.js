const _ = require("lodash");
const CardDeck = require("./cardDeck");
const bettingState = require("../src/constants/bettingState");

class Hand {
  constructor() {
    this.state = bettingState.PREFLOPBET;
    this.communityCards = [];
    this.cardDeck = new CardDeck();
    this.playerContributions = [];
    this.foldedPlayers = [];
    this.betAgreedPlayers = [];
    this.pot = 0;
    this.automaticHandWinner = null;
  }

  initializeHand() {
    this.cardDeck.shuffle();
  }

  addToBetAgreement(player) {
    this.betAgreedPlayers.push(player);
  }

  addToFolded(player) {
    this.foldedPlayers.push(player);
  }

  addToPot(amount) {
    this.pot += amount;
  }

  addPlayerContribution(playerId, contribution) {
    const playerExists = _.find(
      this.playerContributions,
      (c) => c.id === playerId
    );

    if (!playerExists) {
      this.playerContributions.push({ id: playerId, contribution });
    } else {
      this.playerContributions.forEach((c) => {
        if (c.id === playerId) {
          c.contribution += contribution;
        }
      });
    }
  }

  setHandState(handState) {
    this.state = handState;

    switch (this.state) {
      case bettingState.FLOPBET:
        this.communityCards = [...this.cardDeck.takeCards(3)];
        break;

      case bettingState.TURNBET:
        this.communityCards.push(this.cardDeck.takeCards(1)[0]);
        break;

      case bettingState.RIVERBET:
        this.communityCards.push(this.cardDeck.takeCards(1)[0]);
        break;
    }

    console.log("Community Cards", this.communityCards);
  }

  setAutomaticHandWinner(player) {
    this.automaticHandWinner = player;
  }

  getPlayerContribution(playerId) {
    const contributor = _.find(
      this.playerContributions,
      (c) => c.id === playerId
    );

    if (!contributor) {
      return 0;
    }

    return contributor.contribution;
  }

  getPlayerCardHand() {
    const cards = this.cardDeck.takeCards(2);

    return [
      { suit: cards[0].suit, value: cards[0].value },
      { suit: cards[1].suit, value: cards[1].value },
    ];
  }

  getCommunityCards() {
    return [...this.communityCards];
  }

  getPotTotal() {
    return this.pot;
  }

  getMinCallAmount(playerId, coins) {
    let callAmount = 0;

    const playerContribution = this.getPlayerContribution(playerId);

    if (coins > 0) {
      this.playerContributions.forEach((c) => {
        if (c.id !== playerId && c.contribution > playerContribution) {
          callAmount = c.contribution - playerContribution;
        }
      });
    }

    if (callAmount > coins) {
      callAmount = coins;
    }

    return callAmount;
  }

  clearBetAgreedPlayers() {
    this.betAgreedPlayers = [];
  }

  clearFoldedPlayers() {
    this.foldedPlayers = [];
  }

  havePlayersAgreedOnBet(totalPlayers) {
    const handInteractedPlayers =
      this.foldedPlayers.length + this.betAgreedPlayers.length;
    return totalPlayers === handInteractedPlayers;
  }

  doesPlayerNeedToTakeAction(playerId) {
    const isInBetList = _.find(this.betAgreedPlayers, (p) => p.id === playerId);
    const isInFoldedList = _.find(this.foldedPlayers, (p) => p.id === playerId);

    return !isInBetList && !isInFoldedList;
  }

  hasEveryoneElseFolded(totalPlayers) {
    const foldedPlayers = this.foldedPlayers.length;
    return totalPlayers - foldedPlayers === 1;
  }

  hasPlayerFolded(playerId) {
    return _.find(this.foldedPlayers, (f) => f.id === playerId);
  }

  completeHand(winnerId) {
    let playersToBeReimbursed = [];

    const winnerContribution = this.getPlayerContribution(winnerId);
    let winnerCoins = winnerContribution;

    this.playerContributions.forEach((c) => {
      if (c.id !== winnerId) {
        if (c.contribution > winnerContribution) {
          winnerCoins += winnerContribution;
          c.contribution -= winnerContribution;
          playersToBeReimbursed.push({
            id: c.id,
            reimbursment: c.contribution,
          });
        } else {
          winnerCoins += c.contribution;
          c.contribution = 0;
        }
      }
    });

    const involvedPlayers = [];

    this.betAgreedPlayers.forEach((player) => {
      involvedPlayers.push(player);
    });

    this.foldedPlayers.forEach((player) => {
      const foldedPlayer = Object.assign({}, player);
      foldedPlayer.playerHand = [];
      involvedPlayers.push(foldedPlayer);
    });

    return {
      winnerAmount: winnerCoins,
      communityCards: this.getCommunityCards(),
      pot: this.pot,
      playerData: involvedPlayers,
      playersToBeReimbursed,
    };
  }
}

module.exports = Hand;
