var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = mongoose.model("user");
const Token = mongoose.model("token");
const authHelper = require("../Helpers/authHelper");
const { secret } = require("../config/config.json");
const { tokens } = require("../config/config.json").jwt;
const checkToken = require("../middleware/checkToken");

const updateTokens = userId => {
    const accessToken = authHelper.generateAccessToken(userId);
    const refreshToken = authHelper.generateRefreshToken();

    return authHelper
        .replaceDbRefreshToken(refreshToken.id, userId)
        .then(() => ({
            accessToken,
            refreshToken: refreshToken.token,
            accessTokenExpiredAt: Date.now() + tokens.access.expiresIn * 1000,
            refreshTokenExpiredAt: Date.now() + tokens.refresh.expiresIn * 1000
        }));
};

router.post("/login", function(req, res, next) {
    const { username, password } = req.body;
    User.findOne({ username })
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            if (!user.validPassword(password)) {
                return res.status(401).json({ message: "Incorect password" });
            } else {
                return updateTokens(user._id).then(tokens =>
                    res.status(200).json({
                        firstName: user.firstName,
                        id: user._id,
                        image: user.image,
                        middleName: user.middleName,
                        permission: user.permission,
                        surName: user.surName,
                        username: user.username,
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        accessTokenExpiredAt: tokens.accessTokenExpiredAt,
                        refreshTokenExpiredAt: tokens.refreshTokenExpiredAt
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
                    username: username
                });
                user.setPassword(password);
                user.save()
                    .then(result => {
                        res.status(201).json({
                            message: "User created"
                        });
                    })
                    .catch(err => {
                        res.status(500).json({
                            error: err
                        });
                    });
            }
        });
});

router.post("/refresh-token", function(req, res, next) {
    const { refreshToken } = req.body;
    let payload;
    try {
        payload = jwt.verify(refreshToken, secret);
        if (payload.type !== "refresh") {
            res.status(400).json({ message: "Invalid token" });
            return;
        }
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
            res.status(400).json({
                message: "Token expired!"
            });
            return;
        } else if (e instanceof jwt.JsonWebTokenError) {
            res.status(400).json({
                message: "Invalid token!"
            });
            return;
        }
    }
    Token.findOne({ tokenId: payload.id })
        .exec()
        .then(token => {
            if (token === null) {
                throw new Error("Invalid token!");
            }
            return updateTokens(token.userId);
        })
        .then(tokens => res.json(tokens))
        .catch(err => res.status(400).json({ message: err.message }));
});

router.get("/profile", checkToken, function(req, res, next) {
    const user = User.findById(req.user.userId);
    if (!user) {
        return res.status(401).json({
            message: "Seems there are no any user"
        });
    } else {
        res.status(200).json({
            firstName: user.firstName,
            id: user._id,
            image: user.image,
            middleName: user.middleName,
            permission: user.permission,
            surName: user.surName,
            username: user.username,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            accessTokenExpiredAt: tokens.accessTokenExpiredAt,
            refreshTokenExpiredAt: tokens.refreshTokenExpiredAt
        });
    }
});
module.exports = router;
