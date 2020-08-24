const low = require("lowdb");
const FileAsync = require("lowdb/adapters/FileAsync");
const adapter = new FileAsync("texas-holdem-poker-data.json");
const gameInfo = "gameInfo";

class GameService {
  saveGameStartInfo(gameId) {
    const gameStartInfo = {
      id: gameId,
      state: "Started",
      startedAt: new Date(),
    };

    low(adapter)
      .then((db) => {
        const exists = db.has(gameInfo).value();

        if (!exists) {
          db.defaults({ [gameInfo]: [] }).write();
        }

        db.get(gameInfo).push(gameStartInfo).write();
      })
      .catch((reason) => {
        console.error(`Failed to save game start record : ${reason}`);
      });
  }

  saveGameEndInfo(gameId) {
    const gameEndInfo = {
      state: "Ended",
      endedAt: new Date(),
    };

    low(adapter)
      .then((db) => {
        const exists = db.has(gameInfo).value();

        if (exists) {
          try {
            db.get(gameInfo).find({ id: gameId }).assign(gameEndInfo).write();
          } catch (error) {
            console.error(`Failed update game end record: ${error}`);
          }
        }
      })
      .catch((reason) => {
        console.error(`Failed to update game end record : ${reason}`);
      });
  }
}

module.exports = new GameService();
