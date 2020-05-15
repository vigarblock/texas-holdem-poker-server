const _ = require("lodash");
const { values: rankedCardValues } = require("../src/constants/cards");

const determineWinningHand = (players, communityCards) => {
  // For each player
  // 1. Combine player cards with community cards
  // 2. Check all possible ranks and assign the highest available rank for player
  // 3. Pick player which highest rank and return as winner
  const handRankings = [{ playerId: 0, rank: 0 }];

  players.array.forEach((player) => {
    const combinedCards = [...player.playerHand, ...communityCards];
    const handRank = this.getHighestRank(combinedCards);
    handRankings.push({ id: playerHand.id, rank: handRank });
  });

  // 4. Check which players have the same rank.
  // 5. For players with the same rank, apply comparator rules to determine winner
  // 6. Return winning player
};

const getHighestRank = (cards) => {};

const isRoyalFlush = (cards) => {
  let outcome = false;
  const suits = _getSuitCount(cards);

  Object.keys(suits).forEach((key) => {
    if (suits[key] === 5) {
      let winningValues = 0;
      cards.forEach((card) => {
        if (
          (card.suit === key && card.value === "10") ||
          card.value === "J" ||
          card.value === "Q" ||
          card.value === "K" ||
          card.value === "A"
        ) {
          winningValues += 1;
        }
      });

      if (winningValues === 5) {
        outcome = true;
      }
    }
  });

  return outcome;
};

const isStraightFlush = (cards) => {
  let outcome = false;
  const suits = _getSuitCount(cards);

  Object.keys(suits).forEach((key) => {
    if (suits[key] === 5) {
      const flushCards = [];
      cards.forEach((card) => {
        if (card.suit === key) {
          flushCards.push(card);
        }
      });

      outcome = _isInStraightOrder(flushCards);
    }
  });

  return outcome;
};

const isFlush = (cards) => {
  let outcome = false;
  const suits = _getSuitCount(cards);

  Object.keys(suits).forEach((key) => {
    if (suits[key] === 5) {
      outcome = true;
    }
  });

  return outcome;
};

const _isInStraightOrder = (cards) => {
  const sortedCards = _sortCardsByValues(cards);

  for (let i = 0; i < sortedCards.length - 1; i++) {
    const index = _.findIndex(rankedCardValues, (o) => o === sortedCards[i].value);
    const nextRankValue = rankedCardValues[index + 1];

    if (sortedCards[i + 1].value !== nextRankValue) {
      return false;
    }
  }

  return true;
};

const _sortCardsByValues = (cards) => {
  const valueIndexes = [];

  cards.forEach((card) => {
    const index = _.findIndex(rankedCardValues, (o) => o === card.value);
    valueIndexes.push(index);
  });

  const sortedValueIndexes = valueIndexes.sort((a, b) => a - b);
  const sortedCards = [];

  sortedValueIndexes.forEach((index) => {
    const value = rankedCardValues[index];
    const matchingCard = _.find(cards, (c) => c.value === value);
    sortedCards.push(matchingCard);
  });

  return sortedCards;
};

_getSuitCount = (cards) => {
  const suits = {};

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    if (!suits[card.suit]) {
      suits[card.suit] = 1;
    } else {
      suits[card.suit] += 1;
    }
  }

  return suits;
};
module.exports = { isRoyalFlush, isStraightFlush, isFlush };
