const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const con = require("./database");
const middleware = require("./middleware");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const response = (err, res, result) => {
 if (err) {
  console.log(err);
  return res
   .status(400)
   .send({ msg: "Internal server error gathering movie details" });
 } else {
  return res.status(200).json(result);
 }
};

// POST - user REGISTRATION
router.post("/register", middleware.validateUserData, (req, res) => {
 const username = req.body.username;
 const password = req.body.password;

 con.query(
  `SELECT * FROM users WHERE username = ${mysql.escape(username)}`,
  (err, result) => {
   if (err) {
    console.log(err);
    return res
     .status(400)
     .json({ msg: "Internal server error checking username validity" });
   } else if (result.length !== 0) {
    return res.status(400).json({ msg: "Username already exists." });
   } else {
    bcrypt.hash(password, 10, (err, hash) => {
     if (err) {
      return res
       .status(400)
       .json({ msg: "Internal server error hashing user details" });
     } else {
      con.query(
       `INSERT INTO users (username, password) VALUES (${mysql.escape(
        username
       )}, ${mysql.escape(hash)})`,
       (err, result) => {
        if (err) {
         console.log(err);
         return res.status(400).json({
          msg: "Internal server error saving user details.",
         });
        } else {
         return res.status(201).json({
          msg: "New user has been successfully registered!",
         });
        }
       }
      );
     }
    });
   }
  }
 );
});

// POST - LOGIN
router.post("/login", middleware.validateUserData, (req, res) => {
 const username = req.body.username.toLowerCase();

 con.query(
  `SELECT * FROM users WHERE username = ${mysql.escape(username)}`,
  (err, result) => {
   if (err || result.length === 0) {
    console.log(err);
    return res.status(400).json({
     msg: "The provided details are incorrect or the user does not exist",
    });
   } else {
    bcrypt.compare(
     req.body.password,
     result[0].password,
     (bcryptErr, bcryptResult) => {
      if (bcryptErr || !bcryptResult) {
       return res.status(400).json({ msg: "Provided details are incorrect." });
      } else {
       if (bcryptResult) {
        const token = jwt.sign(
         { userId: result[0].id, username: result[0].username },
         process.env.SECRETKEY,
         { expiresIn: "7d" }
        );
        return res.status(200).json({
         msg: "You have succesfully logged in.",
         token,
         userData: {
          userId: result[0].id,
          username: result[0].username,
         },
        });
       }
      }
     }
    );
   }
  }
 );
});

// POST - ADD new movie to COLLECTION
router.post("/collection", middleware.isLoggedIn, (req, res) => {
 const data = req.body;

 con.query(
  `SELECT user_id, imdb_id FROM movies WHERE imdb_id = ${mysql.escape(
   data.imdb_id
  )} AND user_id = ${req.userData.userId}`,
  (err, result) => {
   if (err || result.length !== 0) {
    console.log(err);
    return res.status(400).json({
     msg: "You have this movie in your list already. Explore for more!",
    });
   } else {
    if (data) {
     con.query(
      `INSERT INTO movies (user_id, imdb_id, title, year, genres, duration, rating, description, tagline, poster, fanart, video_id, oscars) VALUES (${
       req.userData.userId
      }, ${mysql.escape(data.imdb_id)}, ${mysql.escape(
       data.title
      )}, ${mysql.escape(data.year)}, ${mysql.escape(
       data.genres
      )}, ${mysql.escape(data.duration)}, ${mysql.escape(
       data.rating
      )}, ${mysql.escape(data.description)}, ${mysql.escape(
       data.tagline
      )}, ${mysql.escape(data.poster)}, ${mysql.escape(
       data.fanart
      )}, ${mysql.escape(data.video_id)}, ${mysql.escape(data.oscars)})`,
      (err, result) => {
       if (err) {
        console.log(err);
        return res.status(400).json({
         msg: "Internal server error gathering movie details",
        });
       } else {
        return res.status(200).json({
         msg: "Movie has been successfully added to Your collection!",
        });
       }
      }
     );
    } else {
     return res.status(400).json({ msg: "Issue getting movie details." });
    }
   }
  }
 );
});

// POST - ADD new movie to WATCHLIST
router.post("/watchlist", middleware.isLoggedIn, (req, res) => {
 const data = req.body;

 con.query(
  `SELECT user_id, imdb_id FROM movies WHERE imdb_id = ${mysql.escape(
   data.imdb_id
  )} AND user_id = ${req.userData.userId}`,
  (err, result) => {
   if (err || result.length !== 0) {
    console.log(err);
    return res.status(400).json({
     msg: "You have this movie in your list already. Explore for more!",
    });
   } else {
    if (data) {
     con.query(
      `INSERT INTO movies (user_id, imdb_id, title, year, genres, duration, rating, description, tagline, poster, fanart, video_id, oscars, seen) VALUES (${
       req.userData.userId
      }, ${mysql.escape(data.imdb_id)}, ${mysql.escape(
       data.title
      )}, ${mysql.escape(data.year)}, ${mysql.escape(
       data.genres
      )}, ${mysql.escape(data.duration)}, ${mysql.escape(
       data.rating
      )}, ${mysql.escape(data.description)}, ${mysql.escape(
       data.tagline
      )}, ${mysql.escape(data.poster)}, ${mysql.escape(
       data.fanart
      )}, ${mysql.escape(data.video_id)}, ${mysql.escape(
       data.oscars
      )}, ${mysql.escape(false)})`,
      (err, result) => {
       if (err) {
        console.log(err);
        return res.status(400).json({
         msg: "Internal server error gathering movie details",
        });
       } else {
        return res.status(200).json({
         msg: "Movie has been successfully added to Your watchlist!",
        });
       }
      }
     );
    } else {
     return res.status(400).json({ msg: "Issue getting movie details." });
    }
   }
  }
 );
});

// POST - CHANGE seen STATEMENT from 'false' to 'true'
router.post("/watchlist/:id", middleware.isLoggedIn, (req, res) => {
 con.query(
  `SELECT id, user_id, seen FROM movies WHERE id = ${mysql.escape(
   req.params.id
  )} AND user_id = ${req.userData.userId}`,
  (err, result) => {
   if (err) {
    console.log(err);
    return res
     .status(400)
     .send({ msg: "Internal server error gathering movie details" });
   } else {
    con.query(
     `UPDATE movies SET seen = true WHERE id = ${mysql.escape(req.params.id)}`,
     (err, result) => {
      if (err) {
       console.log(err);
       return res
        .status(400)
        .json({ msg: "Internal server error gathering movie details" });
      } else {
       return res.status(200).json({
        msg: "Movie has been successfully added to collection!",
       });
      }
     }
    );
   }
  }
 );
});

// GET - COLLECTION where seen = true
router.get("/collection", middleware.isLoggedIn, (req, res) => {
 con.query(
  `SELECT id, imdb_id, title, year, genres, duration, rating, description, tagline,poster, fanart, video_id, oscars, seen FROM movies WHERE seen = true AND user_id = ${req.userData.userId} ORDER BY date DESC`,
  (err, result) => {
   response(err, res, result);
  }
 );
});

// GET - WATCHLITS where seen = false
router.get("/watchlist", middleware.isLoggedIn, (req, res) => {
 con.query(
  `SELECT id, imdb_id, title, year, genres, duration, rating, description, tagline,poster, fanart, video_id, oscars, seen FROM movies WHERE seen = false AND user_id = ${req.userData.userId} ORDER BY date DESC`,
  (err, result) => {
   response(err, res, result);
  }
 );
});

// GET - COLLECTION PREVIEW (8 POSTS) where seen = true
router.get("/collectionPreview", middleware.isLoggedIn, (req, res) => {
 con.query(
  `SELECT poster FROM movies WHERE seen = true AND user_id = ${req.userData.userId} ORDER BY id DESC limit 8`,
  (err, result) => {
   response(err, res, result);
  }
 );
});

// GET - WATCHLIST PREVIEW (8 POSTS) where seen = false
router.get("/watchlistPreview", middleware.isLoggedIn, (req, res) => {
 con.query(
  `SELECT title, description, genres, year, duration, fanart, rating, tagline FROM movies WHERE seen = false AND user_id = ${req.userData.userId} ORDER BY id DESC limit 8`,
  (err, result) => {
   response(err, res, result);
  }
 );
});

// POST - REVIEW
router.post("/reviews", middleware.isLoggedIn, (req, res) => {
 const data = req.body;

 con.query(
  `SELECT movie_id FROM reviews WHERE movie_id = ${mysql.escape(
   data.movie_id
  )}`,
  (err, result) => {
   if (err || result.length !== 0) {
    console.log(err);
    return res.status(400).json({
     msg: "You have reviewed this movie already.",
    });
   } else {
    if (data.review.length <= 1000) {
     con.query(
      `INSERT INTO reviews (movie_id, username, review, imdb_id) VALUES (${mysql.escape(
       data.movie_id
      )}, (SELECT username FROM users WHERE id = ${
       req.userData.userId
      }), ${mysql.escape(data.review)}, ${mysql.escape(data.imdb_id)})`,
      (err, result) => {
       if (err) {
        console.log(err);
        return res.status(400).json({
         msg: "Internal server error gathering movie details",
        });
       } else {
        return res.status(200).json({
         msg: "Review has been successfully added!",
        });
       }
      }
     );
    } else {
     return res.status(400).json({
      msg: "You have exceeded the maximum number of characters allowed.",
     });
    }
   }
  }
 );
});

// GET - REVIEWS
router.get("/reviews/:imdbId", middleware.isLoggedIn, (req, res) => {
 con.query(
  `SELECT id, movie_id, username, review, date FROM reviews WHERE imdb_id = ${mysql.escape(
   req.params.imdbId
  )} ORDER BY date DESC`,
  (err, result) => {
   response(err, res, result);
  }
 );
});

// DELETE - from DB by id
router.delete("/delete/:id", middleware.isLoggedIn, (req, res) => {
 const data = req.params;

 con.query(
  `DELETE FROM movies WHERE id = ${mysql.escape(data.id)} AND user_id = ${
   req.userData.userId
  }`,
  (err, result) => {
   if (err) {
    console.log(err);
    return res.status(400).json({
     msg: "We can not delete selected movie at the moment. Please try again later!",
    });
   } else {
    return res
     .status(200)
     .json({ msg: "Movie has been successfully deleted!" });
   }
  }
 );
});

// GET - DATA by id
router.get("/collection/:id", middleware.isLoggedIn, (req, res) => {
 con.query(
  `SELECT id, imdb_id, title, year, genres, duration, rating, description, tagline,poster, fanart, video_id, oscars, seen FROM movies WHERE id = ${mysql.escape(
   req.params.id
  )}`,
  (err, result) => {
   response(err, res, result);
  }
 );
});

// GET - DATA by id by imdb_id
router.get("/allMovies/:imdbId", middleware.isLoggedIn, (req, res) => {
 con.query(
  `SELECT id, user_id, imdb_id, seen FROM movies WHERE imdb_id = ${mysql.escape(
   req.params.imdbId
  )} AND user_id = ${req.userData.userId}`,
  (err, result) => {
   response(err, res, result);
  }
 );
});

module.exports = router;
