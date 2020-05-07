const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const router = require("./router");
const GameManager = require("./src/gameManager");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const sendToGameRoom = (room, event, data) => {
  io.in(room).emit(event, data);
}

const sendToIndividualPlayer = (playerId, event, data) => {
  io.to(playerId).emit(event, data);
}

GameManager.on("gameHandWinner", (data) => {
  sendToGameRoom(data.gameId, "handWinner", data);
});

GameManager.on("gameWinner", (data) => {
  sendToGameRoom(data.gameId, "gameWinner", data);
});

io.on("connection", (socket) => {
  socket.on("join", ({ gameId, name }) => {
    socket.join(gameId);
    
    const game = GameManager.getGameInstance(gameId);
    game.addPlayerToGame({ id: socket.id, name });

    // Emit opponents to every player individually
    const allJoinedPlayers = game.getAllPlayers();
    allJoinedPlayers.forEach((player) => {
      const opponentsData = game.getOpponentPlayers(player.id);

      if (opponentsData.length > 0) {
        sendToIndividualPlayer(player.id, "opponentsData", { opponentsData })
      }
    });

    // Emit player data
    const player = game.getPlayer(socket.id);
    socket.emit("playerData", { playerData: player });
  });

  socket.on("startGame", ({ gameId }) => {
    const game = GameManager.getGameInstance(gameId);
    // Chip count will come from the game host
    const chipCount = 1000;

    const allPlayers = game.getAllPlayers();
    if (allPlayers.length >= 2) {
      // Update all joined players with chip count
      allPlayers.forEach((player) => {
        game.updatePlayer(player.id, { coins: chipCount });
      });

      // Start first hand
      game.startHand();

      // Emit player and opponent data to each joined player
      allPlayers.forEach((player) => {
        sendToIndividualPlayer(player.id, "playerData", { playerData: player });

        const opponentsData = game.getOpponentPlayers(player.id);

        if (opponentsData.length > 0) {
          sendToIndividualPlayer(player.id, "opponentsData", { opponentsData });
        }
      });

      // Emit game started event to room
      io.in(gameId).emit("gameStarted");
    }
  });

  socket.on("activePlayerAction", ({ gameId, playerId, action, data }) => {
    const game = GameManager.getGameInstance(gameId);
    game.playerAction(playerId, action, data);

    const allPlayers = game.getAllPlayers();
    if (allPlayers.length >= 2) {
      const handCommunityCards = game.getHandCommunityCards();
      sendToGameRoom(gameId, "communityCardsData", { communityCards: handCommunityCards });

      allPlayers.forEach((player) => {
        sendToIndividualPlayer(player.id, "playerData", { playerData: player });

        const opponentsData = game.getOpponentPlayers(player.id);

        if (opponentsData.length > 0) {
          sendToIndividualPlayer(player.id, "opponentsData", { opponentsData });
        }
      });
    }
  });

  socket.on("playerContinue", ({ gameId, playerId }) => {
    const game = GameManager.getGameInstance(gameId);
    game.playerContinue(playerId);

    if (game.isReadyToStartNewHand()) {
      game.startHand();
      const allPlayers = game.getAllPlayers();
      if (allPlayers.length >= 2) {
        const handCommunityCards = game.getHandCommunityCards();
          sendToGameRoom(gameId, "communityCardsData", { communityCards: handCommunityCards });

        allPlayers.forEach((player) => {
          sendToIndividualPlayer(player.id, "playerData", { playerData: player });

          const opponentsData = game.getOpponentPlayers(player.id);

          if (opponentsData.length > 0) {
            sendToIndividualPlayer(player.id, "opponentsData", { opponentsData });
          }
        });
      }
    }
  });

  socket.on("playerExit", ({ gameId, playerId }) => {
    const game = GameManager.getGameInstance(gameId);
    game.removePlayer(playerId);

    if (game.isReadyToStartNewHand()) {
      game.startHand();
      const allPlayers = game.getAllPlayers();
      if (allPlayers.length >= 2) {
        const handCommunityCards = game.getHandCommunityCards();
        sendToGameRoom(gameId, "communityCardsData", { communityCards: handCommunityCards });

        allPlayers.forEach((player) => {
          sendToIndividualPlayer(player.id, "playerData", { playerData: player });

          const opponentsData = game.getOpponentPlayers(player.id);

          if (opponentsData.length > 0) {
            sendToIndividualPlayer(player.id, "opponentsData", { opponentsData });
          }
        });
      }
    }
  });

  socket.on("disconnect", ({ gameId }) => {
    // const game = GameManager.getGameInstance(gameId);
    // game.removePlayer(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
app.use(router);
server.listen(PORT, () => console.log(`Server started on port '${PORT}'`));
