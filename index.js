const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const router = require("./router");
const GameManager = require("./src/gameManager");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "client/build")));
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

GameManager.on("gameError", (data) => {
  sendToGameRoom(data.gameId, "gameError", data.error);
});

GameManager.on("gamePlayerError", (data) => {
  console.log("Sending error to ", data);
  sendToIndividualPlayer(data.socketId, "gameError", data.error);
});

io.on("connection", (socket) => {
  socket.on("join", ({ gameId, name, playerId }) => {
    if (GameManager.addPlayerToGame(gameId, name, playerId, socket.id)) {
      socket.join(gameId);
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

  socket.on("disconnect", () => {
    // TODO: handle disconnection
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port '${PORT}'`));
