const express = require("express");
const GameManager = require("./src/gameManager");
const path = require('path');
const router = express.Router();
const cors = require("cors");

router.get("/create-game", cors(), (req, res) => {
  let minBet = req.query.minBet;
  let startingChips = req.query.startingChips;
  const gameId = GameManager.createGame(minBet, startingChips);
  res.json({ gameId });
});

router.get('*', (req,res) =>{
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

module.exports = router;
