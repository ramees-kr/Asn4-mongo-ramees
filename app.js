const express = require("express");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const path = require("path");
const { join } = require("path");

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
app.set("views", join(__dirname, "views"));

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
        errors: errors,
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

      console.log("movie created", movie);

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

//Delete id form
app.get("/movies/delete", (req, res) => {
  res.render("delete-movie");
});

//Route to delete a movie, search by movie_id
app.post("/movies/delete", async (req, res) => {
  const movieId = req.body.movie_id.trim();
  console.log("movieId", movieId);
  console.log("type of movieId", typeof movieId);

  try {
    let movie;
    if (ObjectId.isValid(movieId)) {
      // Search by ObjectId
      movie = await Movie.findById(movieId).lean();

      if (movie) {
        await Movie.findByIdAndDelete(movie._id);
        res
          .status(200)
          .render("success", { message: "Movie deleted successfully" });
      }
    } else if (!isNaN(movieId)) {
      // Search by numeric movie_id
      movie = await Movie.findOne({ Movie_ID: parseInt(movieId) }).lean();

      if (movie) {
        await Movie.findByIdAndDelete(movie._id);
        res
          .status(200)
          .render("success", { message: "Movie deleted successfully" });
      }
    } else {
      res.status(404).render("error", { message: "Movie not found" });
    }
  } catch (error) {
    console.error("Error Deleting movie:", error);
    res
      .status(500)
      .render("error", { message: "Could not delete the selected movie" });
  }
});

// Update id form
app.get("/movies/edit", (req, res) => {
  res.render("edit-search");
});

// Route to render the edit page
app.post("/movies/edit-movie", async (req, res) => {
  const movieId = req.body.movie_id.trim();
  console.log("movieId", movieId);
  console.log("type of movieId", typeof movieId);

  try {
    let movie;
    if (mongoose.Types.ObjectId.isValid(movieId)) {
      // Search by Mongoose _id
      movie = await Movie.findById(movieId).lean();
    } else if (!isNaN(movieId)) {
      // Search by Movie_ID field
      movie = await Movie.findOne({ Movie_ID: parseInt(movieId) }).lean();
    }

    if (!movie) {
      return res.status(404).render("error", {
        message: "Movie not found. Please try again.",
      });
    }

    // Render the edit form with the movie data
    res.render("edit-movie", {
      movie_id: movie._id,
      title: movie.Title || "",
      year: movie.Year || "",
      rating: movie.imdbRating || "",
    });
  } catch (error) {
    console.error("Error finding movie:", err);
    res.status(500).render("error", {
      message: "An error occurred while searching for the movie.",
    });
  }
});

app.post("/movies/save", async (req, res) => {
  try {
    console.log(req.body);

    // Extract the Movie ID and data from the request body
    const movieId = req.body.movie_id.trim();
    const { title: Title, year: Year, rating: imdbRating } = req.body;

    // Find the movie by ID and update it with the new data
    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { Title, Year: parseInt(Year), imdbRating: parseFloat(imdbRating) },
      { new: true }
    );

    console.log("movie updated", movie);

    // If the movie is not found, return a 404 response
    if (!movie) {
      return res.status(404).send("Movie not found");
    }

    // Redirect to the movies list page
    res.redirect("/movies");
  } catch (error) {
    // Log the error and send a 500 response
    console.error("Error updating movie:", error);
    res.status(500).send("An error occurred while updating the movie");
  }
});

// Start server (process.env.PORT for Vercel)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
