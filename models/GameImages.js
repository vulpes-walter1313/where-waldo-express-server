const mongoose = require("mongoose");

const gameImageSchema = mongoose.Schema({
  name: String,
  imgUrl: String,
  widthpx: Number,
  heightpx: Number,
});

const GameImage = mongoose.model("gameimage", gameImageSchema);

module.exports = GameImage;
