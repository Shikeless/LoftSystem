const { tokens } = require("../config/config.json").jwt;
const { secret } = require("../config/config.json");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const mongoose = require("mongoose");

const Token = mongoose.model("token");

const generateAccessToken = userId => {
    const payload = {
        userId,
        type: tokens.access.type
    };
    const options = { expiresIn: tokens.access.expiresIn };

    return jwt.sign(payload, secret, options);
};

const generateRefreshToken = () => {
    const payload = {
        id: uuid(),
        type: tokens.refresh.type
    };
    const options = { expiresIn: tokens.refresh.expiresIn };

    return {
        id: payload.id,
        tokes: jwt.sign(payload, secret, options)
    };
};

const replaceDbRefreshToken = (tokenId, userId) =>
    Token.findOneAndRemove({ userId })
        .exec()
        .then(() => Token.create({ tokenId, userId }));

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    replaceDbRefreshToken
};
