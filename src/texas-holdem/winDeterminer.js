const _ = require("lodash");
const { values: rankedCardValues } = require("../constants/cards");
const handRanker = require("./handRanker");

const getWinner = (players, communityCards) => {
  const handRankings = [];

  players.array.forEach((player) => {
    const combinedCards = [...player.playerHand, ...communityCards];
    const handRank = getHighestRank(combinedCards);
    handRankings.push({ id: playerHand.id, rank: handRank.rank, rankCards: handRank.cards });
  });

  // TODO
  // 4. Check which players have the same rank.
  // 5. For players with the same rank, apply comparator rules to determine winner
  // 6. Return winning player

  return { winner: "winning-player", winningRankMessage: "Four of a Kind" };
};

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
