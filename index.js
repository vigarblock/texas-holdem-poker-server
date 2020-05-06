const express = require("express");
const socketio = require("socket.io");
const http = require("http");

const router = require("./router");
const GameManager = require("./src/gameManager");

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

GameManager.on("gameHandWinner", (data) => {
  // TODO: Emit to the correct game room
  io.emit("handWinner", data);
});

GameManager.on("gameWinner", (data) => {
  // TODO: Emit to the correct game room
  io.emit("gameWinner", data);
});

io.on("connection", (socket) => {
  socket.on("join", ({ gameId, name }) => {
    const game = GameManager.getGameInstance(gameId);
    game.addPlayerToGame({ id: socket.id, name });

    // Emit opponents to every player individually
    const allJoinedPlayers = game.getAllPlayers();
    allJoinedPlayers.forEach((player) => {
      const opponentsData = game.getOpponentPlayers(player.id);

      if (opponentsData.length > 0) {
        io.to(player.id).emit("opponentsData", { opponentsData });
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
        io.to(player.id).emit("playerData", { playerData: player });

        const opponentsData = game.getOpponentPlayers(player.id);

        if (opponentsData.length > 0) {
          io.to(player.id).emit("opponentsData", { opponentsData });
        }
      });

      // Emit game started event to room
      io.emit("gameStarted");
    }
  });

  socket.on("activePlayerAction", ({ gameId, playerId, action, data }) => {
    const game = GameManager.getGameInstance(gameId);
    game.playerAction(playerId, action, data);

    const allPlayers = game.getAllPlayers();
    if (allPlayers.length >= 2) {
      // Emit hand data if any to everyone connected
      // TODO: This approach won't scale for multiple rooms. Need to fix
      const handCommunityCards = game.getHandCommunityCards();
      io.emit("communityCardsData", { communityCards: handCommunityCards });

      allPlayers.forEach((player) => {
        io.to(player.id).emit("playerData", { playerData: player });

        const opponentsData = game.getOpponentPlayers(player.id);

        if (opponentsData.length > 0) {
          io.to(player.id).emit("opponentsData", { opponentsData });
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
        // Emit hand data if any to everyone connected
        // TODO: This approach won't scale for multiple rooms. Need to fix
        const handCommunityCards = game.getHandCommunityCards();
        io.emit("communityCardsData", { communityCards: handCommunityCards });

        allPlayers.forEach((player) => {
          io.to(player.id).emit("playerData", { playerData: player });

          const opponentsData = game.getOpponentPlayers(player.id);

          if (opponentsData.length > 0) {
            io.to(player.id).emit("opponentsData", { opponentsData });
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
        // Emit hand data if any to everyone connected
        // TODO: This approach won't scale for multiple rooms. Need to fix
        const handCommunityCards = game.getHandCommunityCards();
        io.emit("communityCardsData", { communityCards: handCommunityCards });

        allPlayers.forEach((player) => {
          io.to(player.id).emit("playerData", { playerData: player });

          const opponentsData = game.getOpponentPlayers(player.id);

          if (opponentsData.length > 0) {
            io.to(player.id).emit("opponentsData", { opponentsData });
          }
        });
      }
    }
  });

  socket.on("disconnect", ({ gameId }) => {
    const game = GameManager.getGameInstance(gameId);
    game.removePlayer(socket.id);
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server started on port '${PORT}'`));
