const _ = require("lodash");
const { values: rankedCardValues } = require("../constants/cards");

const isRoyalFlush = (cards) => {
  let outcome = false;
  let royalFlushCards = [];
  const suitsCount = _getSuitCount(cards);

  Object.keys(suitsCount).forEach((suit) => {
    if (suitsCount[suit] === 5) {
      let hasAce = false;
      let hasKing = false;
      let hasQueen = false;
      let hasJack = false;
      let hasTen = false;
      cards.forEach((card) => {
        if (card.suit === suit && card.value === "A") {
          hasAce = true;
          royalFlushCards.push(card);
        }
        if (card.suit === suit && card.value === "K") {
          hasKing = true;
          royalFlushCards.push(card);
        }
        if (card.suit === suit && card.value === "Q") {
          hasQueen = true;
          royalFlushCards.push(card);
        }
        if (card.suit === suit && card.value === "J") {
          hasJack = true;
          royalFlushCards.push(card);
        }
        if (card.suit === suit && card.value === "10") {
          hasTen = true;
          royalFlushCards.push(card);
        }
      });

      if (hasAce && hasKing && hasQueen && hasJack && hasTen) {
        outcome = true;
      }
    }
  });

  return outcome ? { rank: 1, outcome, cards: royalFlushCards } : { outcome };
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

      outcome = isStraight(straightFlushCards).outcome;
    }
  });

  return outcome
    ? { rank: 2, outcome, cards: straightFlushCards }
    : { outcome };
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
    ? {
        rank: 3,
        outcome,
        cards: _.filter(cards, (c) => c.value === winningValue),
      }
    : { outcome };
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
        rank: 4,
        outcome,
        cards: _.filter(
          cards,
          (c) => c.value === winningPairValue || c.value === winningThreeValue
        ),
      }
    : { outcome };
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
    ? {
        rank: 5,
        outcome,
        cards: _.filter(cards, (c) => c.suit === winningSuit),
      }
    : { outcome };
};

const isStraight = (cards) => {
  let outcome;
  const sortedCards = _sortCardsByValues(cards);
  const uniqueSortedCards = [];

  sortedCards.forEach((card) => {
    if (!_.find(uniqueSortedCards, (c) => c.value === card.value)) {
      uniqueSortedCards.push(card);
    }
  });

  let inSequenceCount = 1;
  let straightCards = [];

  for (let i = 0; i < uniqueSortedCards.length - 1; i++) {
    const index = _.findIndex(
      rankedCardValues,
      (o) => o === uniqueSortedCards[i].value
    );

    const nextRankValue = rankedCardValues[index + 1];

    if (uniqueSortedCards[i + 1].value === nextRankValue) {
      if (inSequenceCount === 1) {
        straightCards.push(uniqueSortedCards[i]);
      }
      straightCards.push(uniqueSortedCards[i + 1]);
      inSequenceCount++;

      if(inSequenceCount === 5) {
        outcome = true;
        break;
      }
    } else {
      inSequenceCount = 1;
      straightCards = [];
    }
  }

  console.log('In sequence', straightCards);

  return outcome ? { rank: 6, outcome, cards: straightCards } : { outcome };
};

const isThreeOfAKind = (cards) => {
  let outcome = false;
  const values = _getValuesCount(cards);
  let winningValue;

  Object.keys(values).forEach((key) => {
    if (values[key] >= 3) {
      outcome = true;
      winningValue = key;
    }
  });

  return outcome
    ? {
        rank: 7,
        outcome,
        cards: _.filter(cards, (c) => c.value === winningValue),
      }
    : { outcome };
};

const isTwoPair = (cards) => {
  let pairCount = 0;
  const values = _getValuesCount(cards);
  let winningValues = [];

  Object.keys(values).forEach((key) => {
    if (values[key] >= 2) {
      winningValues.push(key);
      pairCount++;
    }
  });

  const outcome = pairCount === 2;

  return outcome
    ? {
        rank: 8,
        outcome,
        cards: _.filter(
          cards,
          (c) => c.value === winningValues[0] || c.value === winningValues[1]
        ),
      }
    : { outcome };
};

const isOnePair = (cards) => {
  let outcome = false;
  const values = _getValuesCount(cards);
  let winningValue;

  Object.keys(values).forEach((key) => {
    if (values[key] >= 2) {
      outcome = true;
      winningValue = key;
    }
  });

  return outcome
    ? {
        rank: 9,
        outcome,
        cards: _.filter(cards, (c) => c.value === winningValue),
      }
    : { outcome };
};

const getHighCard = (cards) => {
  const sortedCards = _sortCardsByValues(cards);

  return {
    rank: 10,
    outcome: true,
    cards: [sortedCards[sortedCards.length - 1]],
  };
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
