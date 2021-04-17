require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cors = require("cors");

const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

dotenv.config();

const userService = require("./user-service.js");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");

jwtOptions.secretOrKey = process.env.JWT_SECRET;

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  console.log("payload received", jwt_payload);

  if (jwt_payload) {
    next(null, {
      _id: jwt_payload._id,
      userName: jwt_payload.userName,
      password: jwt_payload.password,
    });
  } else {
    next(null, false);
  }
});
passport.use(strategy);
app.use(passport.initialize());
userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });
app.post("/api/user/register", function (req, res) {
  console.log(req.body);
  userService
    .registerUser(req.body)
    .then((data) => {
      console.log(data);
      res.json({ msg: data });
    })
    .catch((err) => {
      console.log(err);
      res.status(422).json({ Error: err });
    });
});

app.post("/api/user/login", function (req, res) {
    userService
      .checkUser(req.body)
      .then((user) => {
        let payload = {
          _id: user._id,
          userName: user.userName,
          password: user.password,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET);
        res.status(200).json({ message: "Login Successful", token: token });
      })
      .catch((err) => {
        res.status(422).json({ msg: "Error 422: User not found." });
      });
  });

  app.get(
    "/api/user/favourites",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
      userService
        .getFavourites(req.user._id)
        .then((data) => {
          console.log(data);
          res.json(data);
        })
        .catch((err) => {
          res.json({ msg: err });
        });
    }
  );

  app.put(
    "/api/user/favourites/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
      userService
        .addFavourite(req.user._id, req.params.id)
        .then((data) => {
          res.json(data);
        })
        .catch((err) => {
          res.status(404).json({ msg: err });
        });
    }
  );
  