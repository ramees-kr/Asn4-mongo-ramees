const express = require("express");
const mongoose = require("mongoose");
const app = express();
const database = require("./config/database");
const bodyParser = require("body-parser");

const port = process.env.PORT || 23234;
app.use(bodyParser.urlencoded({ extended: "true" }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

mongoose
  .connect(database.url)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

const Movie = require("./models/movie");

// Show all movie-info
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Show a specific movie based on the _id /movie_id as well as movie_title
app.get("/api/movies/:movie_id", async (req, res) => {
  try {
    const { movie_id } = req.params;
    let movie;
    if (mongoose.Types.ObjectId.isValid(movie_id)) {
      movie = await Movie.findById(movie_id);
    } else if (!isNaN(movie_id)) {
      movie = await Movie.findOne({ Movie_ID: movie_id });
    } else {
      movie = await Movie.findOne({ Title: movie_id });
    }
    if (!movie) {
      return res.status(404).send("Movie not found");
    }
    res.json(movie);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Insert a new movie
app.post("/api/movies", async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Delete an existing movie (based on the _id or movie_id)
app.delete("/api/movies/:movie_id", async (req, res) => {
  try {
    const { movie_id } = req.params;
    let result;
    if (mongoose.Types.ObjectId.isValid(movie_id)) {
      result = await Movie.findByIdAndDelete(movie_id);
    } else {
      result = await Movie.findOneAndDelete({ Movie_ID: movie_id });
    }
    if (!result) {
      return res.status(404).send("Movie not found");
    }
    res.send("Movie successfully deleted");
  } catch (err) {
    res.status(500).send(err);
  }
});

// Update movie_title & "Released" of an existing movie (based on the _id or movie_id)
app.put("/api/movies/:movie_id", async (req, res) => {
  try {
    const { movie_id } = req.params;
    const { Title, Released } = req.body;
    let movie;
    if (mongoose.Types.ObjectId.isValid(movie_id)) {
      movie = await Movie.findByIdAndUpdate(
        movie_id,
        { Title, Released },
        { new: true }
      );
    } else {
      movie = await Movie.findOneAndUpdate(
        { Movie_ID: movie_id },
        { Title, Released },
        { new: true }
      );
    }
    if (!movie) {
      return res.status(404).send("Movie not found");
    }
    res.json(movie);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(port);
console.log("App listening on port : " + port);
