const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Sever Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const getDirectorObj = (dbObject) => ({
  directorId: dbObject.director_id,
  directorName: dbObject.director_name,
});

const getMovieName = (dbObject) => ({
  movieName: dbObject.movie_name,
});

//1. Get movies API

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `SELECT * FROM movie ORDER BY movie_id;`;
  const moviesList = await db.all(getMoviesQuery);
  response.send(moviesList.map((eachObj) => getMovieName(eachObj)));
  //response.send(moviesList);
});

// 2. Add Movie API
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;

  const { directorId, movieName, leadActor } = movieDetails;

  const addMovieQuery = `
                            INSERT INTO movie
                            (director_id, movie_name, lead_actor)
                            VALUES
                            (${directorId},"${movieName}","${leadActor}");
                            `;
  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

// 3. Get Movie API

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const getMovieQuery = `SELECT * FROM movie WHERE movie_id = ${movieId};`;
  const movie = await db.get(getMovieQuery);
  response.send({
    movieId: movie["movie_id"],
    directorId: movie["director_id"],
    movieName: movie["movie_name"],
    leadActor: movie["lead_actor"],
  });
});

// 4. Update movie API

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;

  const { directorId, movieName, leadActor } = movieDetails;

  const putMovieQuery = `UPDATE movie
                            SET
                               director_id = ${directorId},
                                movie_name = "${movieName}",
                                lead_actor = "${leadActor}"
                                WHERE movie_id = ${movieId};`;
  await db.run(putMovieQuery);
  response.send("Movie Details Updated");
});

// 5. Delete Movie API

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const deleteMovieQuery = `DELETE FROM movie WHERE movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

// 6. Get Directors API
app.get("/directors/", async (request, response) => {
  const directorsQuery = `SELECT * FROM director ORDER BY director_id;`;

  const directorsList = await db.all(directorsQuery);
  response.send(directorsList.map((eachObj) => getDirectorObj(eachObj)));
});

// 7. Get movies by DirectorId API
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const movieByDirectorQuery = `SELECT movie_name FROM director 
                                    INNER JOIN movie  
                                    ON director.director_id = movie.director_id
                                    WHERE director.director_id =${directorId};`;
  const movieList = await db.all(movieByDirectorQuery);
  response.send(movieList.map((eachObj) => getMovieName(eachObj)));
  console.log(directorId);
});

module.exports = app;
