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

    console.log('Community Cards', this.communityCards);
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
      { suit: cards[0].suit, cardValue: cards[0].value },
      { suit: cards[1].suit, cardValue: cards[1].value },
    ];
  }

  getCommunityCards() {
    return [...this.communityCards];
  }

  addToPot(amount) {
    this.pot += amount;
  }

  getPotTotal() {
    return this.pot;
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
    const isInBetList = _.find(
      this.betAgreedPlayers,
      (p) => p.id === playerId
    );
    const isInFoldedList = _.find(
      this.foldedPlayers,
      (p) => p.id === playerId
    );

    return !isInBetList && !isInFoldedList;
  }

  hasEveryoneElseFolded(totalPlayers) {
    const foldedPlayers = this.foldedPlayers.length;
    return totalPlayers - foldedPlayers === 1;
  }
}

module.exports = Hand;
