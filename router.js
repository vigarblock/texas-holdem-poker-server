const express = require("express");
const GameManager = require("./src/gameManager");
const router = express.Router();
const cors = require('cors');

router.get("/", (req, res) => {
  res.send("Welcome to texas holdem server");
});

router.get("/create-game", cors(), (req, res) => {
  const gameId = GameManager.createGame();
  res.json({ gameId });
});

module.exports = router;
