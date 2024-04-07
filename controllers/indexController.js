const asyncHandler = require("express-async-handler");
const Scores = require("../models/Scores");

module.exports.GET_GAMEIMAGE = asyncHandler(async (req, res) => {
  res.send("route /gameimage has not been handled yet");
});

module.exports.POST_VERIFYCLICK = asyncHandler(async (req, res) => {
  res.send("route POST /verifyclick has not been implemented yet");
});

module.exports.GET_SCOREBOARD = asyncHandler(async (req, res) => {
  let limit = parseInt(req.query.limit) || 10;
  if (limit > 50) {
    limit = 50;
  }
  const scores = await Scores.find({})
    .sort({ scoreMillis: "asc" })
    .limit(limit)
    .exec();
  const numOfScores = scores.length;
  res.json({ success: true, topScores: scores, numOfScores: numOfScores });
});

module.exports.POST_SCOREBOARD = asyncHandler(async (req, res) => {
  res.send("POST /scoreboard has not been implemented yet.");
});
