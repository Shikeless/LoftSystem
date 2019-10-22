var createError = require("http-errors");
var express = require("express");
var session = require("express-session");
const mongoose = require("mongoose");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const MongoClient = require("mongodb").MongoClient;
var MongoStore = require("connect-mongo")(session);
const bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
const config = require("./config/config.json");
require("./models");

var apiRouter = require("./routes/api");

var app = express();

// view engine setup
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());
app.use(
    session({
        store: new MongoStore({ mongooseConnection: mongoose.connection }),
        secret: "secret",
        key: "key",
        cookie: {
            path: "/",
            httpOnly: true,
            maxAge: 30 * 60 * 1000
        },
        saveUninitialized: false,
        resave: true,
        ephemeral: true,
        rolling: true
    })
);
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/api", apiRouter);
app.use("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
