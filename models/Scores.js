const mongoose = require("mongoose");

const scoresSchema = mongoose.Schema({
  username: String,
  scoreMillis: Number,
});

const Scores = mongoose.model("scores", scoresSchema);

module.exports = Scores;
