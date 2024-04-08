const asyncHandler = require("express-async-handler");
const Scores = require("../models/Scores");
const GameImage = require("../models/GameImages");
const { query, matchedData, validationResult } = require("express-validator");

module.exports.GET_GAMEIMAGE = [
  query("imageCode").notEmpty(),
  asyncHandler(async (req, res) => {
    const valResult = validationResult(req);

    if (valResult.isEmpty()) {
      const { imageCode } = matchedData(req);
      console.log(`imageCode is ${imageCode}`);
      if (imageCode === "1" || imageCode === "2") {
        const imageInfo = await GameImage.findOne({
          name: `waldo-${imageCode}`,
        }).exec();
        req.session.startTime = Date.now();
        req.session.gameName = imageInfo.name;
        req.session.endTime = null;
        req.session.waldoFound = false;
        req.session.wizardFound = false;
        return res.json({ success: true, imageUrl: imageInfo.imgUrl });
      } else {
        // error here
        const error = new Error("imageCode asked for doesn't exists");
        error.status = 400;
        throw error;
      }
    } else {
      return res.json({ success: false, error: valResult.array() });
    }
  }),
];

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
