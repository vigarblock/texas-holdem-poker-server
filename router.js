const express = require("express");
const GameManager = require("./src/gameManager");
const path = require("path");
const router = express.Router();
const cors = require("cors");
let disableGameCreation = false;

router.get("/create-game", cors(), (req, res) => {
  let minBet = req.query.minBet;
  let startingChips = req.query.startingChips;

  if (!disableGameCreation) {
    const gameId = GameManager.createGame(minBet, startingChips);
    res.json({ gameId });
  } else {
    res.status(500).json({
      reason:
        "New games cannot be created at this moment as the server is under maintenance. " +
        "We should be back shortly.",
    });
  }
});

router.get("/toggle-game-creation", cors(), (req, res) => {
  let adminCode = req.query.adminCode;

  if(adminCode === "atxpd") {
    disableGameCreation = !disableGameCreation;
  }
  
  res.status(200);
});

router.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/client/build/index.html"));
});

module.exports = router;
