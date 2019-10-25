const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const mongoose = require("mongoose");

const Token = mongoose.model("token");

const generateAccessToken = userId => {
    const payload = {
        userId,
        type: "access"
    };
    const options = { expiresIn: +process.env.ACS_TKN_EXPIRESIN };
    console.log(options);

    return jwt.sign(payload, process.env.SECRET, options);
};

const generateRefreshToken = () => {
    const payload = {
        id: uuid(),
        type: "refresh"
    };
    const options = { expiresIn: +process.env.REF_TKN_EXPIRESIN };
    console.log(options);

    return {
        id: payload.id,
        token: jwt.sign(payload, process.env.SECRET, options)
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
