const express = require("express");
const GameManager = require("./src/gameManager");
const path = require("path");
const router = express.Router();
const cors = require("cors");

router.get("/", cors(), (req, res) => {
  res.sendStatus(200);
});

router.get("/create-game", cors(), (req, res) => {
  let minBet = req.query.minBet;
  let startingChips = req.query.startingChips;

  const gameId = GameManager.createGame(minBet, startingChips);
  res.json({ gameId });
});

module.exports = router;
