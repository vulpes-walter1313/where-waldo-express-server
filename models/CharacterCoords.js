const mongoose = require("mongoose");

const characterCoordsSchema = mongoose.Schema({
  gameName: {
    type: mongoose.ObjectId,
    ref: "gameimage",
  },
  character: String,
  x: Number,
  y: Number,
  xRange: Number,
  yRange: Number,
});

const CharacterCoord = mongoose.model("charactercoord", characterCoordsSchema);

module.exports = CharacterCoord;
