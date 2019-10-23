var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = mongoose.model("user");
const authHelper = require("../Helpers/authHelper");
const { secret } = require("../config/config.json");

const updateTokens = userId => {
    const accessToken = authHelper.generateAccessToken(userId);
    const refreshToken = authHelper.generateRefreshToken();

    return authHelper
        .replaceDbRefreshToken(refreshToken.id, userId)
        .then(() => ({
            accessToken,
            refreshToken: refreshToken.token
        }));
};

router.post("/login", function(req, res, next) {
    const { username, password } = req.body;
    User.findOne({ username })
        .exec()
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            if (!user.validPassword(password)) {
                return res.status(401).json({ message: "Incorect password" });
            } else {
                return updateTokens(user._id).then(tokens =>
                    res.status(200).json({
                        message: "Auth succesful",
                        ...user,
                        ...tokens
                    })
                );
            }
        })
        .catch(err => res.status(500).json({ message: err.message }));
});

router.post("/registration", function(req, res, next) {
    const { username, password, firstName, middleName, surName } = req.body;
    User.findOne({ username })
        .exec()
        .then(user => {
            if (user) {
                return res.status(409).json({
                    message: "Username exists"
                });
            } else {
                const user = new User({
                    firstName,
                    middleName,
                    surName,
                    id: new mongoose.Types.ObjectId(),
                    username: username
                });
                user.setPassword(password);
                user.save()
                    .then(result => {
                        console.log(result);
                        res.status(201).json({
                            message: "User created"
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            error: err
                        });
                    });
            }
        });
});

module.exports = router;
