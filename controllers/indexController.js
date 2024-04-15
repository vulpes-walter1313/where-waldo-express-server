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
      if (imageCode === "1" || imageCode === "2") {
        const imageInfo = await GameImage.findOne({
          name: `waldo-${imageCode}`,
        }).exec();
        req.session.startTime = Date.now();
        req.session.gameName = imageInfo.name;
        req.session.endTime = null;
        req.session.waldoFound = false;
        req.session.wizardFound = false;
        req.session.scoreSubmitted = false;
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

module.exports.POST_SCOREBOARD = [
  body("username").isAlphanumeric().isLength({ max: 40 }),
  asyncHandler(async (req, res) => {
    const valResult = validationResult(req);
    if (valResult.isEmpty()) {
      const timeScoreMillis = req.session.endTime - req.session.startTime;
      if (req.session.scoreSubmitted) {
        const error = new Error("Score already submitted");
        error.status = 400;
        throw error;
      }
      const { username } = matchedData(req);

      // check if less than 50 scores are in db
      const quantityOfScores = await Scores.countDocuments({}).exec();
      if (quantityOfScores < 50) {
        const newScore = new Scores({
          username: username ?? "Anonymous",
          scoreMillis: timeScoreMillis,
        });
        await newScore.save();
        req.session.scoreSubmitted = true;
        return res.json({
          success: true,
          isTopScore: true,
          score: newScore.scoreMillis,
        });
      } else {
        // if 50 then check if new score beats the last score.
        const lastScore = (
          await Scores.find({}).sort({ scoreMillis: "desc" }).limit(1).exec()
        )[0];
        console.log("last score:\n");
        console.log(lastScore);
        if (lastScore.scoreMillis > timeScoreMillis) {
          await Scores.findByIdAndDelete(lastScore._id);
          const newScore = new Scores({
            username: username ?? "Anonymous",
            scoreMillis: timeScoreMillis,
          });
          await newScore.save();
          req.session.scoreSubmitted = true;
          return res.json({
            success: true,
            isTopScore: true,
            score: newScore.scoreMillis,
          });
        } else {
          // score not in top 50
          req.session.scoreSubmitted = true;
          return res.json({
            success: true,
            isTopScore: false,
            score: timeScoreMillis,
          });
        }
        // res.json({success: tr})
      }

      // if newscore beats last score, drop last score
      // and insert new score.
    } else {
      return res.status(400).json({ success: false, error: valResult.array() });
    }
  }),
];

module.exports.GET_GAMESTATS = asyncHandler( async (req, res) => {
  if (req.session.endTime === null) {
    res.json({success: true, gameWon: false});
  } else {
    const score = req.session.endTime - req.session.startTime;
    const lastScore = (
      await Scores.find({}).sort({ scoreMillis: "desc" }).limit(1).exec()
    )[0];
    const isTopScore = lastScore.scoreMillis > score ? true : false;
    res.json({success: true, gameWon: true, score: score, isTopScore: isTopScore});
  }
});
