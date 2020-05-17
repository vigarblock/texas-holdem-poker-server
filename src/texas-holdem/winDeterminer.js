const _ = require("lodash");
const { values: rankedCardValues } = require("../constants/cards");
const texasHoldemRankings = require("../constants/texasHoldemRankings");
const handRanker = require("./handRanker");

const getWinners = (players, communityCards) => {
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

  let winners;

  if(topRankedHands.length > 1) {
    winners = getWinnerFromTiedRanks(topRankedHands, players);
  } else {
    winners = [topRankedHands[0]];
  }

  const winningRankMessage = texasHoldemRankings[winners[0].rank];
  return { winners, winningRankMessage };
};

const getWinnerFromTiedRanks = (rankedHands, players) => {
  // Check if a winner can be determined by high card within tied ranks
  let highCardOfPlayers = {};

  rankedHands.forEach(rankedHand => {
    const { cards: [highCard] } = handRanker.getHighCard(rankedHand.rankCards);
    highCardOfPlayers[rankedHand.id] = _.findIndex(rankedCardValues, (o) => o === highCard.value);
  });

  let topHighCardRank = 0;
  let highCardWinners = [];

  Object.keys(highCardOfPlayers).forEach(key => {
    if(highCardOfPlayers[key] > topHighCardRank) {
      topHighCardRank = highCardOfPlayers[key];
      highCardWinners = [];
      highCardWinners.push(key);
    } else if(highCardOfPlayers[key] === topHighCardRank) {
      highCardWinners.push(key);
    }
  });

  // Tie can be resolved by high card.
  if(highCardWinners.length === 1) {
    return [_.find(rankedHands, r => r.id === highCardWinners[0])];
  }

  // Check if a winner can be determined by original player hand
  const involvedPlayers = [];

  players.forEach(player => {
    if(_.find(rankedHands), r => r.id === player.id){
      involvedPlayers.push(player);
    }
  });

  const cardValueIndexPlayers = {};

  involvedPlayers.forEach(player => {
    player.playerHand.forEach(card => {
      if(!(card.value in cardValueIndexPlayers)) {
        cardValueIndexPlayers[card.value] = [player.id];
      } else {
        cardValueIndexPlayers[card.value].push(player.id);
      }
    })
  });

  let topPersonalHandRank = 0;
  let highestPersonalHandRankWinners = [];

  Object.keys(cardValueIndexPlayers).forEach(key => {
    if(cardValueIndexPlayers[key].length === 1) {
      if(rankedCardValues.findIndex(r => r === key) > topPersonalHandRank) {
        topPersonalHandRank = rankedCardValues.findIndex(r => r === key);
        highestPersonalHandRankWinners = [];
        highestPersonalHandRankWinners.push(cardValueIndexPlayers[key][0]);
      } else if(rankedCardValues.findIndex(r => r === key) === topPersonalHandRank) {
        highestPersonalHandRankWinners.push(cardValueIndexPlayers[key][0]);
      }
    }
  })

  if(highestPersonalHandRankWinners.length === 1) {
    return [_.find(rankedHands, r => r.id === highestPersonalHandRankWinners[0])];
  }

  // No way to determine winner, return all tied players as winners
  return rankedHands
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

module.exports = { getWinner: getWinners };
