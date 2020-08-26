const express = require("express");
const socketio = require("socket.io");
const { v4: uuidv4 } = require("uuid");
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

GameManager.on("playerUpdates", (data) => {
  data.updates.forEach((p) => {
    sendToIndividualPlayer(p.socketId, "playerUpdates", {
      playerData: p.playerData,
      opponentsData: p.opponentsData,
      timeStamp: data.timeStamp,
      lastPerformedAction: data.lastPerformedAction
    });
  });
});

GameManager.on("gameError", (data) => {
  sendToGameRoom(data.gameId, "gameError", data.error);
});

GameManager.on("gamePlayerError", (data) => {
  sendToIndividualPlayer(data.socketId, "gameError", data.error);
});

io.on("connection", (socket) => {
  socket.on("join", ({ gameId, name, playerId }) => {
    if (GameManager.addPlayerToGame(gameId, name, playerId, socket.id)) {
      socket.join(gameId);
      const msg = {
        id: uuidv4(),
        name: "Game Admin",
        message:
          `${name.toUpperCase()} ` +
          `joined the game. Click Start Game if all players have joined.`,
      };
      sendToGameRoom(gameId, "gameMessage", msg);
    }
  });

  socket.on("startGame", ({ gameId }) => {
    GameManager.startGame(gameId);
    io.in(gameId).emit("gameStarted");
  });

  socket.on("activePlayerAction", ({ gameId, playerId, action, data }) => {
    GameManager.playerAction(gameId, playerId, action, data);
  });

  socket.on("playerExit", ({ gameId, playerId }) => {
    GameManager.playerExit(gameId, playerId);
    socket.leave(gameId);
  });

  socket.on("playerMessage", ({ gameId, id, playerName, message }) => {
    io.in(gameId).emit("gameMessage", { id, name: playerName, message });
  });
});

const PORT = process.env.PORT || 80;
server.listen(PORT, () => console.log(`Server started on port '${PORT}'`));
