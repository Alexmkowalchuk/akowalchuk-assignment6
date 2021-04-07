const express = require('express');
const cors = require("cors");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");

dotenv.config();

const userService = require("./user-service.js");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;
app.use(express.json());
app.use(cors());

let  ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
jwtOptions.secretOrKey = process.env.JWT_SECRET;

let strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next){
    console.log('payload received', jwt_payload);

    if(jwt_payload){
        next(null,
            {_id: jwt_payload._id,
            userName: jwt_payload.userName});
    } else {
        next(null,false);
    }
});

passport.use(strategy);
app.use(passport.initialize());

/* TODO Add Your Routes Here */

app.get("/",(req,res)=>{
    res.json({"message": "start"});
})

app.post("/api/user/register",(req,res)=>{
    userService.registerUser(req.body)
    .then((msg)=> {
        res.json({"message": "BAAAD"});
    })
    .catch((msg) =>{
        res.status(422).json({"message": msg})
    });
});

app.post("/api/user/login",(req,res)=>{
    userService.checkUser(req.body)
    .then((user)=>{
        var payload = {
            _id: user._id,
            userName: user.userName
        }
        let token = jwt.sign({payload},secretOrKey);
        res.json({"message": "login successful", "token": token });
    })
    .catch((msg)=>{
        res.status(422).json({"message": msg});
    });
});

app.get("/api/user/favorites", passport.authenticate('jwt', {session: false}), (req,res)=>{
    userService.getFavourites(req.user._id)
    .then((favorites)=>{
        res.json({"favorites": favorites});
    })
    .catch((msg)=>{
        res.json({"message":msg});
    });
});

app.put("/api/user/favorites/:id", passport.authenticate('jwt', {session: false}), (res,req)=>{
    userService.addFavourite(req.user._id,req.params.id)
    .then((favorites)=>{
        res.json({"favorites": favorites});
    })
    .catch((msg)=>{
        res.json({"message":msg});
    })
})

app.delete("/app/user/favorites/:id", passport.authenticate('jwt', {session: false}),(req,res)=>{
    userService.removeFavourite(req.params.id)
    .then((favorites)=>{
        res.json({"favorites": favorites});
    })
    .catch((msg)=>{
        res.json({"message":msg});
    });
});

userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})
.catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
});


