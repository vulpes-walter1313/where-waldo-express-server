const asyncHandler = require("express-async-handler");
module.exports.GET_GAMEIMAGE = asyncHandler(async (req, res) => {
  res.send("route /gameimage has not been handled yet");
});

module.exports.POST_VERIFYCLICK = asyncHandler(async (req, res) => {
  res.send("route POST /verifyclick has not been implemented yet");
});

module.exports.GET_SCOREBOARD = asyncHandler(async (req, res) => {
  res.send("GET /scoreboard has not been implemented yet.");
});

module.exports.POST_SCOREBOARD = asyncHandler(async (req, res) => {
  res.send("POST /scoreboard has not been implemented yet.");
});
