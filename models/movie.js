const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MovieSchema = new Schema({
  Title: { type: String, required: true },
  Year: { type: Number, required: true },
  Rated: String,
  Released: String,
  Runtime: String,
  Genre: String,
  Director: String,
  Writer: String,
  Actors: String,
  Plot: String,
  Language: String,
  Country: String,
  Awards: String,
  Poster: String,
  imdbRating: Number,
  imdbID: String,
});

module.exports = mongoose.model("Movie", MovieSchema);
