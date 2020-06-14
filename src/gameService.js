const FirestoreClient = require("../src/clients/firestoreClient");
const gameInfo = "gameInfo";

class GameService {
  saveGameStartInfo(gameId) {
    const gameStartInfo = {
      docName: gameId,
      state: "Started",
      startedAt: new Date(),
    };

    FirestoreClient.save(gameInfo, gameStartInfo).catch((reason) =>
      console.log(`Failed to save game start info : ${reason}`)
    );
  }

  saveGameEndInfo(gameId) {
    const gameEndInfo = {
      docName: gameId,
      state: "Ended",
      endedAt: new Date(),
    };

    FirestoreClient.update(gameInfo, gameEndInfo).catch((reason) =>
      console.log(`Failed to save game start info : ${reason}`)
    );
  }
}

module.exports = new GameService();
