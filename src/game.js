const _ = require("lodash");
const CardDeck = require("./cardDeck");
const PLAYER_LIMIT = 5;

const handState = {
  STARTED: "STARTED",
  PREFLOPBET: "PREFLOPBET",
  FLOPBET: "FLOPBET",
  TURNBET: "TURNBET",
  RIVERBET: "RIVERBET",
};

class Game {
  constructor() {
    this.name = "my-test-game";
    this.players = [];
    this.hand = {
      state: handState.STARTED,
      cardDeck: {},
      players: [],
      foldedPlayers: [],
      currentPlayerIndex: 0,
      currentBet: 0,
      betAgreedPlayers: [],
      pot: 0,
    };
    this.activePlayer = {};
  }

  startHand() {
    this.hand.cardDeck = new CardDeck();
    this.hand.cardDeck.shuffle();

    // Assign each player 2 cards from the deck
    for (let index = 0; index < this.players.length; index++) {
      const cards = this.hand.cardDeck.takeCards(2);

      this.players[index].playerHand = [
        { suit: cards[0].suit, cardValue: cards[0].value },
        { suit: cards[1].suit, cardValue: cards[1].value },
      ];

      if (this.players[index].position === 1) {
        this.players[index].isActive = true;
        this.activePlayer = this.players[index];
      }
    }

    this.hand.state = handState.PREFLOPBET;
    this.hand.players = _.sortBy(this.hand.players, ["position"]);
  }

  playerAction(playerId, action, actionData) {
    switch (this.hand.state) {
      case handState.PREFLOPBET:
        const player = this.getPlayer(playerId);

        if (player.isActive) {
          if (action === "Check") {
            this.hand.betAgreedPlayers.push(player);
            this.updatePlayer(playerId, {
              action: { name: "Checked", value: "" },
            });
          }

          if (action === "Call") {
            const newCoinStack = player.coins - actionData;
            this.updatePlayer(playerId, {
              coins: newCoinStack,
              action: { name: "Called", value: "" },
            });
            this.hand.betAgreedPlayers.push(player);
          }

          if (action === "Fold") {
            this.hand.foldedPlayers.push(player);
            this.updatePlayer(playerId, {
              action: { name: "Folded", value: "" },
            });
          }

          if (action === "Raise") {
            const newCoinStack = player.coins - actionData;
            this.updatePlayer(playerId, {
              coins: newCoinStack,
              action: { name: "Raised", value: actionData },
            });

            // Clear all previous bet agreements
            this.hand.betAgreedPlayers = [];
            this.hand.betAgreedPlayers.push(player);
          }

          let repeat = true;
          while (repeat) {
            // Get next player position based on index
            let nextPlayerPosition = player.position + 1;
            if (nextPlayerPosition > this.players.length) {
              nextPlayerPosition = 1;
            }

            console.log("GETTING NEXT PLAYER", nextPlayerPosition);
            const nextPlayer = this.getPlayerByPosition(nextPlayerPosition);
            console.log("GOT NEXT PLAYER", nextPlayer);

            // Check if next player is already in bet list
            const isInBetList = _.find(
              this.hand.betAgreedPlayers,
              (player) => player.id === nextPlayer.id
            );
            const isInFoldedList = _.find(
              this.hand.foldedPlayers,
              (player) => player.id === nextPlayer.id
            );

            if (!isInBetList && !isInFoldedList) {
              this.updatePlayer(playerId, { isActive: false });
              this.updatePlayer(nextPlayer.id, { isActive: true });
              repeat = false;
            } else {
              const totalPlayers =
                this.hand.foldedPlayers.length +
                this.hand.betAgreedPlayers.length;

              if (totalPlayers === this.players.length) {
                this.hand.state = handState.FLOPBET;

                // SHOW FLOP
                repeat = false;
              }
            }
          }
        }
        console.log("HAND", this.hand);
        break;

      case handState.FLOPBET:
        console.log("CAME TO FLOP BET");
        break;

      case handState.TURNBET:
        break;

      case handState.RIVERBET:
        break;

      default:
        break;
    }
  }

  // TODO: Move player handling into own class
  addPlayer(data) {
    const playerPosition = this.players.length + 1;
    if (playerPosition > PLAYER_LIMIT) {
      throw Error("The game is full");
    }
    const player = {
      id: data.id,
      isActive: false,
      position: this.players.length + 1,
      name: data.name,
      coins: 0,
      action: { name: "Joined", value: "" },
      playerHand: [],
    };

    this.players.push(player);

    console.log("New player", player);
  }

  updatePlayer(playerId, { isActive, coins, action, playerHand }) {
    const updatedPlayer = this.players.forEach((player) => {
      if (playerId === player.id) {
        if (isActive) {
          player.isActive = isActive;
        }

        if (coins) {
          player.coins = coins;
        }

        if (action) {
          player.action = action;
        }

        if (playerHand) {
          player.playerHand = playerHand;
        }

        return player;
      }
    });
  }

  getOpponentPlayers(currentPlayerId) {
    if (this.players.length == 0) {
      return [];
    }

    const opponents = [];

    // TODO: Remove player hand details
    this.players.forEach((player) => {
      if (player.id !== currentPlayerId) {
        opponents.push(player);
      }
    });

    return opponents;
  }

  getPlayer(playerId) {
    if (this.players.length == 0) {
      return undefined;
    }

    return _.find(this.players, (player) => player.id === playerId);
  }

  getPlayerByPosition(playerPosition) {
    if (this.players.length == 0) {
      return undefined;
    }

    return _.find(this.players, (player) => player.position === playerPosition);
  }

  getAllPlayers() {
    return this.players;
  }

  removePlayer(playerId) {
    _.remove(this.players, (player) => player.id === playerId);

    console.log("Player list updated", this.players);
  }
}

module.exports = new Game();
