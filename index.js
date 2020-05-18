const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const router = require("./router");
const GameManager = require("./src/gameManager");

const app = express();
app.use(router);
const server = http.createServer(app);
const io = socketio(server);

const sendToGameRoom = (room, event, data) => {
  io.in(room).emit(event, data);
};

const sendToIndividualPlayer = (playerSocketId, event, data) => {
  io.to(playerSocketId).emit(event, data);
};

GameManager.on("gameHandWinner", (data) => {
  sendToGameRoom(data.gameId, "handWinner", data);
});

GameManager.on("gameWinner", (data) => {
  sendToGameRoom(data.gameId, "gameWinner", data);
});

GameManager.on("communityUpdates", (data) => {
  sendToGameRoom(data.gameId, "communityUpdates", data);
});

GameManager.on("playerUpdates", (updates) => {
  updates.forEach((p) => {
    sendToIndividualPlayer(p.socketId, "playerUpdates", {
      playerData: p.playerData,
      opponentsData: p.opponentsData,
    });
  });
});

io.on("connection", (socket) => {
  socket.on("join", ({ gameId, name, playerId }) => {
    socket.join(gameId);
    const game = GameManager.getGameInstance(gameId);
    game.addPlayerToGame({ id: playerId, name, socketId: socket.id });
    game.emitPlayerUpdates();
  });

  socket.on("startGame", ({ gameId }) => {
    const game = GameManager.getGameInstance(gameId);
    if (!game.hasGameStarted()) {
      game.initializeGame();
      game.startHand();
      game.emitPlayerUpdates();
      io.in(gameId).emit("gameStarted");
    }
  });

  socket.on("activePlayerAction", ({ gameId, playerId, action, data }) => {
    const game = GameManager.getGameInstance(gameId);
    game.playerAction(playerId, action, data);

    if (!game.hasHandEnded()) {
      game.emitPlayerUpdates();
      game.emitCommunityUpdates();
    }
  });

  socket.on("playerExit", ({ gameId, playerId }) => {
    const game = GameManager.getGameInstance(gameId);
    game.removePlayer(playerId);
    socket.leave(gameId);
  });

  socket.on("disconnect", () => {
    // TODO: handle disconnection
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port '${PORT}'`));
