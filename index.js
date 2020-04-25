const express = require("express");
const socketio = require("socket.io");
const http = require("http");

const router = require("./router");
const Game = require("./src/game");

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
  socket.on("join", ({ name }) => {
    console.log(`'${socket.id}' joined the game`);

    // Join the new socket connection to the same room.
    socket.join(Game.name);

    // Add the new player
    Game.addPlayer({ id: socket.id, name });

    // Emit opponents to everyone
    const opponentsData = Game.getOpponentPlayers(socket.id);
    socket.broadcast.to(Game.name).emit('opponentsData', { opponentsData });

    // Emite player data
    const player = Game.getPlayer(socket.id);
    socket.emit('playerData', { playerData: player})
  });

  socket.on("startGame", () => {
    console.log("Game is starting");

    const chipCount = 1000;

    // When game starts
    // 1. Give each player chips
  });

  socket.on("startHand", () => {
    console.log("New Hand is starting");
  });

  socket.on("disconnect", () => {
    console.log(`'${socket.id}' disconnected`);
    Game.removePlayer(socket.id);
  });

  socket.on("activePlayerAction", ({ name, value }) => {
    console.log("Received player action: " + name + " : Value - " + value);
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server started on port '${PORT}'`));
