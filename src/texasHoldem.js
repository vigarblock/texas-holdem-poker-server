const _ = require("lodash");

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
  const suits = {};

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    if (!suits[card.suit]) {
      suits[card.suit] = 1;
    } else {
      suits[card.suit] += 1;
    }
  }

  Object.keys(suits).forEach((key) => {
    if (suits[key] === 5) {
      let winningValues = 0;
      cards.forEach((card) => {
        if (card.suit === suits[key]) {
          if (
            card.value === "10" ||
            card.value === "J" ||
            card.value === "Q" ||
            card.value === "K" ||
            card.value === "A"
          ) {
            winningValues += 1;
          }
        }
      });

      if (winningValues === 5) {
        return true;
      }
    }
  });

  return false;
};

module.exports = { isRoyalFlush };
