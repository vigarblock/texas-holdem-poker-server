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

    // TODO: Prevent joining when game has started

    // Add the new player
    Game.addPlayer({ id: socket.id, name });

    // Emit opponents to every player individually
    const allJoinedPlayers = Game.getAllPlayers();
    allJoinedPlayers.forEach((player) => {
      const opponentsData = Game.getOpponentPlayers(player.id);

      if (opponentsData.length > 0) {
        console.log("Return opponent data for player - " + name, opponentsData);
        io.to(player.id).emit("opponentsData", { opponentsData });
      }
    });

    // Emit player data
    const player = Game.getPlayer(socket.id);
    socket.emit("playerData", { playerData: player });
  });

  socket.on("startGame", () => {
    console.log("Game is starting");
    const chipCount = 1000;

    const allPlayers = Game.getAllPlayers();
    if (allPlayers.length >= 2) {
      // Update coin stack of all players
      allPlayers.forEach((player) => {
        Game.updatePlayer(player.id, { coins: chipCount });
        const updatedPlayer = Game.getPlayer(player.id);
        io.to(player.id).emit("playerData", { playerData: updatedPlayer });
      });

      allPlayers.forEach((player) => {
        const opponentsData = Game.getOpponentPlayers(player.id);

        if (opponentsData.length > 0) {
          io.to(player.id).emit("opponentsData", { opponentsData });
        }
      });
    }
  });

  socket.on("startHand", () => {
    console.log("New Hand is starting");

    Game.startHand();

    const allPlayers = Game.getAllPlayers();
    if (allPlayers.length >= 2) {
      allPlayers.forEach((player) => {
        io.to(player.id).emit("playerData", { playerData: player});

        const opponentsData = Game.getOpponentPlayers(player.id);

        if (opponentsData.length > 0) {
          io.to(player.id).emit("opponentsData", { opponentsData });
        }
      });
    }

    io.emit('handStarted');
  });

  socket.on("disconnect", () => {
    console.log(`'${socket.id}' disconnected`);
    Game.removePlayer(socket.id);
  });

  socket.on("activePlayerAction", ({ playerId, action, data }) => {
    Game.playerAction(playerId, action, data);
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server started on port '${PORT}'`));
