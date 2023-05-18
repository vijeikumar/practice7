const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertToCamelCase = (eachObj) => {
  return {
    playerId: eachObj.player_id,
    playerName: eachObj.player_name,
  };
};
const convertMathDetails = (matchEach) => {
  return {
    matchId: matchEach.match_id,
    match: matchEach.match,
    year: matchEach.year,
  };
};
const convertPlayerScore = (matchScore) => {
  return {
    playerMatchId: matchScore.player_match_id,
    playerId: matchScore.player_id,
    matchId: matchScore.match_id,
    score: matchScore.score,
    fours: matchScore.fours,
    sixes: matchScore.sixes,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayers = `SELECT * FROM player_details`;
  dbResponse = await db.all(getPlayers);
  response.send(dbResponse.map((eachOne) => convertToCamelCase(eachOne)));
});

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `SELECT * FROM player_details WHERE player_id=${playerId}`;
  const getDetails = await db.get(getPlayer);
  response.send(convertToCamelCase(getDetails));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId}`;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `SELECT * FROM match_details WHERE match_id=${matchId}`;
  const dbResponse = await db.get(getMatch);
  response.send(convertMathDetails(dbResponse));
});
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatches = `SELECT * FROM match_details NATURAL JOIN player_match_score WHERE player_id=${playerId}`;
  const getAllMatches = await db.all(getMatches);
  response.send(getAllMatches.map((eachOne) => convertMathDetails(eachOne)));
});
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersFromMatch = `SELECT * FROM player_details NATURAL JOIN player_match_score WHERE match_id=${matchId}`;
  const playerDetails = await db.all(getPlayersFromMatch);
  response.send(playerDetails.map((eachOne) => convertToCamelCase(eachOne)));
});
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScores = `
    SELECT player_details.player_id AS playerId,player_details.player_name AS playerName,SUM(player_match_score.score) AS totalScore,SUM(player_match_score.fours) AS totalFours,SUM(player_match_score.sixes) AS totalSixes FROM player_details INNER JOIN player_match_score ON player_details.player_id=player_match_score.player_id WHERE player_details.player_id=${playerId}`;
  const getScoresResult = await db.all(getPlayerScores);
  response.send(getScoresResult);
});
module.exports = app;
