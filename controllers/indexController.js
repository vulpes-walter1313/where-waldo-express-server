const asyncHandler = require("express-async-handler");
const Scores = require("../models/Scores");
const GameImage = require("../models/GameImages");
const CharacterCoords = require("../models/CharacterCoords");
const {
  query,
  body,
  matchedData,
  validationResult,
} = require("express-validator");

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

module.exports.POST_VERIFYCLICK = [
  body("character").custom((value) => {
    if (value === "waldo" || value === "wizard") {
      return true;
    } else {
      throw new Error("Not a valid character in verifyclick body");
    }
  }),
  body("xCoord").isNumeric(),
  body("yCoord").isNumeric(),
  body("widthpx").isNumeric(),
  body("heightpx").isNumeric(),
  asyncHandler(async (req, res) => {
    const valResult = validationResult(req);

    if (valResult.isEmpty()) {
      const {
        character: charName,
        xCoord: clickXCoord,
        yCoord: clickYCoord,
        widthpx: clickWidthPx,
        heightpx: clickHeightPx,
      } = matchedData(req);
      console.log(`character: ${charName}\nxCoords: ${clickXCoord}\nyCoordS`);
      // get game being played
      const game = await GameImage.findOne({
        name: req.session.gameName,
      }).exec();

      // get character coords for the character of the game above.
      const character = await CharacterCoords.findOne({
        gameName: game,
        character: charName,
      }).exec();

      // verify click and update session data
      const characterRelX = character.x / game.widthpx;
      const characterRelY = character.y / game.heightpx;
      const characterXVarience = Math.abs(
        characterRelX - (character.x + character.xRange) / game.widthpx,
      );
      const characterYVarience = Math.abs(
        characterRelY - (character.y + character.yRange) / game.heightpx,
      );

      const clickRelX = clickXCoord / clickWidthPx;
      const clickRelY = clickYCoord / clickHeightPx;

      const characterXFound =
        Math.abs(clickRelX - characterRelX) < characterXVarience;
      const characterYFound =
        Math.abs(clickRelY - characterRelY) < characterYVarience;

      const characterFound = characterXFound && characterYFound;

      if (characterFound) {
        if (character.character === "waldo") {
          req.session.waldoFound = true;
        } else if (character.character === "wizard") {
          req.session.wizardFound = true;
        }
        // check if game won
        if (req.session.waldoFound && req.session.wizardFound) {
          // game won
          req.session.endTime = Date.now();
          const time = req.session.endTime - req.session.startTime;
          const scores = await Scores.find({})
            .sort({ scoreMillis: "asc" })
            .exec();
          const newTopScore = time < scores[scores.length - 1].scoreMillis;
          return res.json({
            success: true,
            clickIsCorrect: true,
            wonGame: true,
            isTopScore: newTopScore,
            score: time,
          });
        } else {
          // character found but game not won
          return res.json({
            success: true,
            clickIsCorrect: true,
            wonGame: false,
          });
        }
      } else {
        // character not found, we'll get 'em next time.
        res.json({ success: true, clickIsCorrect: false, wonGame: false });
      }
    } else {
      // json body validation failed
      res
        .status(400)
        .json({ success: false, error: valResult.array(), status: 400 });
    }
  }),
];

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
