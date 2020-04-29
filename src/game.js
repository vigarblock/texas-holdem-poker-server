const _ = require("lodash");
const CardDeck = require("./cardDeck");
const PlayerService = require("./playerService");
const bettingState = {
  PREFLOPBET: "PREFLOPBET",
  FLOPBET: "FLOPBET",
  TURNBET: "TURNBET",
  RIVERBET: "RIVERBET",
};

class Game {
  constructor() {
    this.name = "my-first-game";
    this.hand = {};

    this.playerService = new PlayerService();
  }

  startHand() {
    this.hand = {
      state: bettingState.PREFLOPBET,
      communityCards: [],
      cardDeck: new CardDeck(),
      players: [],
      foldedPlayers: [],
      currentPlayerIndex: 0,
      currentBet: 0,
      betAgreedPlayers: [],
      pot: 0,
    };

    this.hand.cardDeck.shuffle();
    this._initializePlayerHandsAndSetStarter();
  }

  playerAction(playerId, action, actionData) {
    const player = this.playerService.getPlayer(playerId);

    switch (this.hand.state) {
      case bettingState.PREFLOPBET:
        if (player.isActive) {
          const onBetAgreement = () => {
            this.hand.state = bettingState.FLOPBET;
            const flopCards = this.hand.cardDeck.takeCards(3);
            this.hand.communityCards = [...flopCards];

            // Make player 0 active again to start new hand
            const playerOne = this.playerService.getPlayerByPosition(1);
            this.playerService.updatePlayer(playerOne.id, {
              isActive: true,
            });
          };

          this._handlePlayerAction(player, action, actionData);
          this._determineBetAgreement(player, onBetAgreement);
        } else {
          throw Error(`Player '${player.name}' performed an illegal action`);
        }
        break;

      case bettingState.FLOPBET:
        if (player.isActive) {
          const onBetAgreement = () => {
            this.hand.state = bettingState.TURNBET;
            const [turnCard] = this.hand.cardDeck.takeCards(1);
            this.hand.communityCards.push(turnCard);

            // Make player 0 active again to start new hand
            const playerOne = this.playerService.getPlayerByPosition(1);
            this.playerService.updatePlayer(playerOne.id, {
              isActive: true,
            });
          };

          this._handlePlayerAction(player, action, actionData);
          this._determineBetAgreement(player, onBetAgreement);
        } else {
          throw Error(`Player '${player.name}' performed an illegal action`);
        }
        break;

      case bettingState.TURNBET:
        if (player.isActive) {
          const onBetAgreement = () => {
            this.hand.state = bettingState.RIVERBET;
            const [riverCard] = this.hand.cardDeck.takeCards(1);
            this.hand.communityCards.push(riverCard);

            // Make player 0 active again to start new hand
            const playerOne = this.playerService.getPlayerByPosition(1);
            this.playerService.updatePlayer(playerOne.id, {
              isActive: true,
            });
          };

          this._handlePlayerAction(player, action, actionData);
          this._determineBetAgreement(player, onBetAgreement);
        } else {
          throw Error(`Player '${player.name}' performed an illegal action`);
        }
        break;

      case bettingState.RIVERBET:
        if (player.isActive) {
          const onBetAgreement = () => {
            // Determine Winner
          };

          this._handlePlayerAction(player, action, actionData);
          this._determineBetAgreement(player, onBetAgreement);
        } else {
          throw Error(`Player '${player.name}' performed an illegal action`);
        }
        break;

      default:
        break;
    }
  }

  _haveAllPlayersAgreedOnBet() {
    const totalPlayers =
      this.hand.foldedPlayers.length + this.hand.betAgreedPlayers.length;

    return totalPlayers === this.playerService.getAllPlayers().length;
  }

  _getNextPlayer(currentPlayerPosition) {
    // Get next player position based on index
    let nextPlayerPosition = currentPlayerPosition + 1;
    if (nextPlayerPosition > this.playerService.getAllPlayers().length) {
      nextPlayerPosition = 1;
    }

    const nextPlayer = this.playerService.getPlayerByPosition(
      nextPlayerPosition
    );

    return nextPlayer;
  }

  _doesPlayerNeedToTakeAction(player) {
    const isInBetList = _.find(
      this.hand.betAgreedPlayers,
      (p) => p.id === player.id
    );
    const isInFoldedList = _.find(
      this.hand.foldedPlayers,
      (p) => p.id === player.id
    );

    return !isInBetList && !isInFoldedList;
  }

  _determineBetAgreement(player, onBetAgreement) {
    // Determine if another player needs to made active or the bet is settled
    let repeat = true;
    let nextPlayerCalculationPosition = player.position;
    while (repeat) {
      const nextPlayer = this._getNextPlayer(nextPlayerCalculationPosition);

      if (this._doesPlayerNeedToTakeAction(nextPlayer)) {
        this.playerService.updatePlayer(nextPlayer.id, {
          isActive: true,
        });
        repeat = false;
      } else {
        if (this._haveAllPlayersAgreedOnBet()) {
          onBetAgreement();
          this.hand.betAgreedPlayers = [];
          repeat = false;
        }

        nextPlayerCalculationPosition = nextPlayer.position;
      }
    }

    // Make the current player inactive
    this.playerService.updatePlayer(player.id, { isActive: false });
  }

  _handlePlayerAction(player, action, actionData) {
    if (action === "check") {
      this.hand.betAgreedPlayers.push(player);
      this.playerService.updatePlayer(player.id, {
        action: { name: "Checked", value: "" },
      });
    }

    if (action === "call") {
      const newCoinStack = player.coins - parseInt(actionData);
      this.playerService.updatePlayer(player.id, {
        coins: newCoinStack,
        action: { name: "Called", value: "" },
      });
      this.hand.betAgreedPlayers.push(player);
    }

    if (action === "fold") {
      this.hand.foldedPlayers.push(player);
      this.playerService.updatePlayer(player.id, {
        action: { name: "Folded", value: "" },
      });
    }

    if (action === "raise") {
      const newCoinStack = player.coins - parseInt(actionData);
      this.playerService.updatePlayer(player.id, {
        coins: newCoinStack,
        action: { name: "Raised", value: actionData },
      });

      // Clear all previous bet agreements
      this.hand.betAgreedPlayers = [];
      this.hand.betAgreedPlayers.push(player);
    }
  }

  addPlayerToGame({ id, name }) {
    this.playerService.addPlayer({ id, name });
  }

  updatePlayer(playerId, playerData) {
    this.playerService.updatePlayer(playerId, playerData);
  }

  removePlayer(playerId) {
    this.playerService.removePlayer(playerId);
  }

  getPlayer(playerId) {
    return this.playerService.getPlayer(playerId);
  }

  getAllPlayers() {
    return this.playerService.getAllPlayers();
  }

  getOpponentPlayers(playerId) {
    return this.playerService.getOpponentPlayers(playerId);
  }

  getHandCommunityCards() {
    return [...this.hand.communityCards];
  }

  _initializePlayerHandsAndSetStarter() {
    // Determine Hand starter
    const startingPlayer = 1;

    const joinedPlayers = this.playerService.getAllPlayers();
    joinedPlayers.forEach((player) => {
      const cards = this.hand.cardDeck.takeCards(2);

      const playerHand = [
        { suit: cards[0].suit, cardValue: cards[0].value },
        { suit: cards[1].suit, cardValue: cards[1].value },
      ];

      let playerData = { playerHand };

      if (player.position === startingPlayer) {
        playerData.isActive = true;
      }

      this.playerService.updatePlayer(player.id, playerData);
    });

    this.hand.players = _.sortBy(this.playerService.getAllPlayers(), [
      "position",
    ]);
  }
}

module.exports = new Game();
