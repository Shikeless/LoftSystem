var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = mongoose.model("user");
const Token = mongoose.model("token");
const News = mongoose.model("news");
const authHelper = require("../Helpers/authHelper");
const { secret } = require("../config/config.json");
const { tokens } = require("../config/config.json").jwt;
const checkToken = require("../middleware/checkToken");
const multer = require("multer");
const path = require("path");

router.get("/", function(req, res, next) {
    // News.find({}, function(err, news) {
    //     console.log(news);
    //     var newsMap = {};
    //     news.forEach(function(topic) {
    //         newsMap[topic._id] = topic;
    //     });
    //     console.log(newsMap);
    //     res.send(newsMap);
    // });
    // res.send(123);
});

module.exports = router;
