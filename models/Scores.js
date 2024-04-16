const mongoose = require("mongoose");

const scoresSchema = mongoose.Schema({
  username: String,
  scoreMillis: Number,
  game: {
    type: mongoose.ObjectId,
    ref: "gameimage",
  },
});

const Scores = mongoose.model("scores", scoresSchema);

module.exports = Scores;
