const express = require("express");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const path = require("path");
require("dotenv").config();
const { param, body, validationResult } = require("express-validator");
const { ObjectId } = require("mongodb");

const port = process.env.PORT || 2341;
app.use(bodyParser.urlencoded({ extended: "true" }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {},
  })
);
app.set("view engine", "hbs");

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

//Databse connection
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

const Movie = require(path.join(__dirname, "models", "movie"));

// Home route
app.get("/", function (req, res) {
  res.render("index", { title: "Assignment 4" });
});

// Get all movies
app.get("/movies", async (req, res) => {
  try {
    const movies = await Movie.find({}).lean();
    res.render("movies", { movies });
    //res.json(movies);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to render the search page
app.get("/movies/searchbox", (req, res) => {
  res.render("search");
});

app.post("/movies/search", async (req, res) => {
  const movieId = req.body.movie_id.trim();
  console.log("movieId", movieId);
  console.log("type of movieId", typeof movieId);

  try {
    let movie;
    if (ObjectId.isValid(movieId)) {
      // Search by ObjectId
      movie = await Movie.findById(movieId).lean();
    } else if (!isNaN(movieId)) {
      // Search by numeric movie_id
      movie = await Movie.findOne({ Movie_ID: parseInt(movieId) }).lean();
      //console.log("movie", movie);
    } else {
      // Search by title (can return multiple results) case-insensitive search
      movie = await Movie.find({
        Title: { $regex: new RegExp(movieId, "i") },
      }).lean();
    }

    if (movie.length === 0) {
      res.status(404).render("error", { message: "Movie not found" });
    } else {
      res.render("movies", {
        title: "Movie Search Results",
        movies: Array.isArray(movie) ? movie : [movie],
      });
    }
  } catch (error) {
    console.error("Error searching for movie:", error);
    res.status(500).render("error", { message: "Internal server error" });
  }
});

// Route to render the add movie page
app.get("/movies/new", (req, res) => {
  res.render("add-movie");
});

// Route to add a new movie
app.post(
  "/movies/add",
  [
    // Validation rules using express-validator
    body("Title").notEmpty().withMessage("Title is required").trim().escape(),
    body("Year")
      .notEmpty()
      .withMessage("Year is required")
      .isNumeric()
      .withMessage("Year must be a number")
      .isLength({ min: 4, max: 4 })
      .withMessage("Year must be a 4-digit number"),
    body("Rated").optional().trim().escape(),
    body("Released").optional().trim().escape(),
    body("Runtime").optional().trim().escape(),
    body("Genre").optional().trim().escape(),
    body("Director").optional().trim().escape(),
    body("Writer").optional().trim().escape(),
    body("Actors").optional().trim().escape(),
    body("Plot").optional().trim().escape(),
    body("Language").optional().trim().escape(),
    body("Country").optional().trim().escape(),
    body("Awards").optional().trim().escape(),
    body("Poster").optional().trim(),
    body("imdbRating")
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage("IMDB Rating must be between 0 and 10"),
    body("imdbID").optional().trim().escape(),
  ],
  async (req, res) => {
    // Validate the inputs
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Show errors
      return res.status(400).render("error", {
        message: "Validation errors occurred",
        errors: errors.array(),
      });
    }

    try {
      const {
        Title,
        Year,
        Rated,
        Released,
        Runtime,
        Genre,
        Director,
        Writer,
        Actors,
        Plot,
        Language,
        Country,
        Awards,
        Poster,
        imdbRating,
        imdbID,
      } = req.body;

      // Create a new movie using the valid data
      const movie = await Movie.create({
        Title,
        Year,
        Rated,
        Released,
        Runtime,
        Genre,
        Director,
        Writer,
        Actors,
        Plot,
        Language,
        Country,
        Awards,
        Poster,
        imdbRating,
        imdbID,
      });

      // Fetch all movies for the display page
      const movies = await Movie.find().lean();

      // Render movies list
      res.render("movies", {
        title: "Movie List",
        movies: Array.isArray(movies) ? movies : [movies],
      });
    } catch (err) {
      console.error("Error adding movie:", err);
      res.status(500).render("error", {
        message: "An error occurred while adding the movie. Please try again.",
      });
    }
  }
);

// Start server (process.env.PORT for Vercel)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/*


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
console.log("App listening on port : " + port);*/
