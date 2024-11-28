const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema({
  Movie_ID: Number,
  Title: String,
  Year: Number,
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
  imdbVotes: String,
  imdbID: String,
  Type: String,
  DVD: String,
  BoxOffice: String,
  Production: String,
  Website: String,
});

module.exports = mongoose.model("Movie", MovieSchema);
