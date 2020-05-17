const _ = require("lodash");
const { values: rankedCardValues } = require("../constants/cards");
const texasHoldemRankings = require("../constants/texasHoldemRankings");
const handRanker = require("./handRanker");

const getWinner = (players, communityCards) => {
  const handRankings = [];

  players.forEach((player) => {
    const combinedCards = [...player.playerHand, ...communityCards];
    const handRank = getHighestRank(combinedCards);
    handRankings.push({
      id: player.id,
      rank: handRank.rank,
      rankCards: handRank.cards,
    });
  });

  let topRankedHands = [];
  let topRank = 10;

  handRankings.forEach((hand) => {
    if (hand.rank < topRank) {
      topRank = hand.rank;
      topRankedHands = [];
      topRankedHands.push(hand);
    } else if (hand.rank === topRank) {
      topRankedHands.push(hand);
    }
  });

  let winner;

  if(topRankedHands.length > 1) {
    winner = getWinnerFromTiedRanks(topRankedHands);
  } else {
    winner = topRankedHands[0];
  }

  const winningRankMessage = texasHoldemRankings[winner.rank];
  return { winner, winningRankMessage };
};

const getWinnerFromTiedRanks = (rankedHands) => {
  rankedHands.forEach(h => console.log(h));

  // 1. Check if the ranked cards have a high card winner
  // 2. If ranked cards are all the same, compare players original cards against each other
  // 3. If both those can't determine a winner, split winnings

  rankedHands.forEach(rankedHand => {
    const bestCard = handRanker.getHighCard(rankedHand.rankCards);
  })
}

const getHighestRank = (cards) => {
  let index = 1;
  let rank;
  while (index <= 10) {
    rank = checkHandRank(index, cards);
    if (rank.outcome === true) {
      break;
    }
    index++;
  }

  return rank;
};

const checkHandRank = (index, cards) => {
  let result;

  switch (index) {
    case 1:
      result = handRanker.isRoyalFlush(cards);
      break;
    case 2:
      result = handRanker.isStraightFlush(cards);
      break;
    case 3:
      result = handRanker.isFourOfAKind(cards);
      break;
    case 4:
      result = handRanker.isFullHouse(cards);
      break;
    case 5:
      result = handRanker.isFlush(cards);
      break;
    case 6:
      result = handRanker.isStraight(cards);
      break;
    case 7:
      result = handRanker.isThreeOfAKind(cards);
      break;
    case 8:
      result = handRanker.isTwoPair(cards);
      break;
    case 9:
      result = handRanker.isOnePair(cards);
      break;
    case 10:
      result = handRanker.getHighCard(cards);
      break;

    default:
      throw Error("Unable to determine hand rank");
  }

  return result;
};

module.exports = { getWinner };
