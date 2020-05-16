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
  let royalFlushCards = [];
  const suitsCount = _getSuitCount(cards);

  Object.keys(suitsCount).forEach((suit) => {
    if (suitsCount[suit] === 5) {
      let winningValues = 0;
      cards.forEach((card) => {
        if (
          (card.suit === suit && card.value === "10") ||
          card.value === "J" ||
          card.value === "Q" ||
          card.value === "K" ||
          card.value === "A"
        ) {
          winningValues += 1;
          royalFlushCards.push(card);
        }
      });

      if (winningValues === 5) {
        outcome = true;
      }
    }
  });

  return outcome ? { outcome, cards: royalFlushCards } : { outcome };
};

const isStraightFlush = (cards) => {
  let outcome = false;
  let straightFlushCards = [];
  const suits = _getSuitCount(cards);

  Object.keys(suits).forEach((key) => {
    if (suits[key] === 5) {
      cards.forEach((card) => {
        if (card.suit === key) {
          straightFlushCards.push(card);
        }
      });

      outcome = isStraight(straightFlushCards);
    }
  });

  return outcome ? { outcome, cards: straightFlushCards } : { outcome };
};

const isFlush = (cards) => {
  let outcome = false;
  const suitCount = _getSuitCount(cards);
  let winningSuit;

  Object.keys(suitCount).forEach((suit) => {
    if (suitCount[suit] === 5) {
      outcome = true;
      winningSuit = suit;
    }
  });

  return outcome
    ? { outcome, cards: _.filter(cards, (c) => c.suit === winningSuit) }
    : { outcome };
};

const isStraight = (cards) => {
  const sortedCards = _sortCardsByValues(cards);
  const uniqueSortedCardValues = [];

  sortedCards.forEach((card) => {
    if (!_.find(uniqueSortedCardValues, (c) => c === card.value)) {
      uniqueSortedCardValues.push(card.value);
    }
  });

  let inSequenceCount = 1;

  for (let i = 0; i < uniqueSortedCardValues.length - 1; i++) {
    const index = _.findIndex(
      rankedCardValues,
      (o) => o === uniqueSortedCardValues[i]
    );
    const nextRankValue = rankedCardValues[index + 1];

    if (uniqueSortedCardValues[i + 1] === nextRankValue) {
      inSequenceCount++;
    } else {
      inSequenceCount = 1;
    }
  }

  return inSequenceCount === 5;
};

const isFourOfAKind = (cards) => {
  let outcome = false;
  let winningValue;
  const values = _getValuesCount(cards);

  Object.keys(values).forEach((key) => {
    if (values[key] >= 4) {
      outcome = true;
      winningValue = key;
    }
  });

  return outcome
    ? { outcome, cards: _.filter(cards, (c) => c.value === winningValue) }
    : { outcome };
};

const isThreeOfAKind = (cards) => {
  let outcome = false;
  const values = _getValuesCount(cards);

  Object.keys(values).forEach((key) => {
    if (values[key] >= 3) {
      outcome = true;
    }
  });

  return outcome;
};

const isTwoPair = (cards) => {
  let pairCount = 0;
  const values = _getValuesCount(cards);

  Object.keys(values).forEach((key) => {
    if (values[key] >= 2) {
      pairCount++;
    }
  });

  return pairCount === 2;
};

const isOnePair = (cards) => {
  let outcome = false;
  const values = _getValuesCount(cards);

  Object.keys(values).forEach((key) => {
    if (values[key] >= 2) {
      outcome = true;
    }
  });

  return outcome;
};

const isFullHouse = (cards) => {
  const values = _getValuesCount(cards);
  let hasThreeOfAKind = false;
  let winningThreeValue;
  let hasPair = false;
  let winningPairValue;

  Object.keys(values).forEach((key) => {
    if (values[key] >= 3) {
      hasThreeOfAKind = true;
      winningThreeValue = key;
    }

    if (values[key] === 2) {
      hasPair = true;
      winningPairValue = key;
    }
  });

  const outcome = hasThreeOfAKind && hasPair;

  return outcome
    ? {
        outcome,
        cards: _.filter(
          cards,
          (c) => c.value === winningPairValue || c.value === winningThreeValue
        ),
      }
    : { outcome };
};

const getHighCard = (cards) => {
  const sortedCards = _sortCardsByValues(cards);

  return sortedCards[sortedCards.length - 1];
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

const _getSuitCount = (cards) => {
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

const _getValuesCount = (cards) => {
  const values = {};

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    if (!values[card.value]) {
      values[card.value] = 1;
    } else {
      values[card.value] += 1;
    }
  }

  return values;
};

module.exports = {
  isRoyalFlush,
  isStraightFlush,
  isFlush,
  isStraight,
  isFourOfAKind,
  isFullHouse,
  isThreeOfAKind,
  isTwoPair,
  isOnePair,
  getHighCard,
};
