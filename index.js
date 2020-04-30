const express = require("express");
const socketio = require("socket.io");
const http = require("http");

const router = require("./router");
const Game = require("./src/game");

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

Game.on('handWinner', (data) => {
  io.emit('handWinner', data);
});

Game.on('gameWinner', (data) => {
  io.emit('gameWinner', data);
});

io.on("connection", (socket) => {
  socket.on("join", ({ name }) => {
    console.log(`'${socket.id}' joined the game`);

    // TODO: Prevent joining when game has started

    // Add the new player
    Game.addPlayerToGame({ id: socket.id, name });

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

    // Chip count will come from the game host
    const chipCount = 1000;

    const allPlayers = Game.getAllPlayers();
    if (allPlayers.length >= 2) {
      // Update all joined players with chip count
      allPlayers.forEach((player) => {
        Game.updatePlayer(player.id, { coins: chipCount });
      });

      // Start first hand
      Game.startHand();

      // Emit player and opponent data to each joined player
      allPlayers.forEach((player) => {
        io.to(player.id).emit("playerData", { playerData: player});

        const opponentsData = Game.getOpponentPlayers(player.id);

        if (opponentsData.length > 0) {
          io.to(player.id).emit("opponentsData", { opponentsData });
        }
      });

      // Emit game started event to room
      io.emit('gameStarted');
    }
  });

  socket.on("activePlayerAction", ({ playerId, action, data }) => {
    Game.playerAction(playerId, action, data);

    const allPlayers = Game.getAllPlayers();
    if (allPlayers.length >= 2) {

      // Emit hand data if any to everyone connected
      // TODO: This approach won't scale for multiple rooms. Need to fix
      const handCommunityCards = Game.getHandCommunityCards();
      io.emit('communityCardsData', { communityCards: handCommunityCards });

      allPlayers.forEach((player) => {
        io.to(player.id).emit("playerData", { playerData: player});

        const opponentsData = Game.getOpponentPlayers(player.id);

        if (opponentsData.length > 0) {
          io.to(player.id).emit("opponentsData", { opponentsData });
        }
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`'${socket.id}' disconnected`);
    Game.removePlayer(socket.id);
  });
});

app.use(router);

server.listen(PORT, () => console.log(`Server started on port '${PORT}'`));
