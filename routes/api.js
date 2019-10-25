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

const upload = multer({
    storage: multer.diskStorage({
        destination: path.resolve(process.cwd() + "/uploads/"),
        filename: (req, file, cb) => {
            const extension = path.extname(file.originalname);
            cb(null, file.fieldname + "-" + Date.now() + extension);
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedFileTypes = ["image/png", "image/jpg", "image/jpeg"];
        if (!allowedFileTypes.includes(file.mimetype)) {
            return cb(new Error("File must be image"));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 2097152
    }
});

function getAllNews(res) {
    News.find({}, (err, news) => {
        let items = JSON.parse(JSON.stringify(news));
        items.forEach(item => (item.id = item._id));
        res.json(items);
    });
}

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

router.get("/profile", checkToken, async function(req, res, next) {
    const user = await User.findById(req.user.userId);
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

router.patch("/profile", checkToken, upload.single("avatar"), async function(
    req,
    res,
    next
) {
    const {
        firstName,
        middleName,
        surName,
        oldPassword,
        newPassword
    } = req.body;
    const user = await User.findOne({ _id: req.user.userId });
    if (newPassword) {
        if (user.validPassword(oldPassword)) {
            user.setPassword(newPassword);
        } else {
            return res.status(401).json({ message: "Incorect old password" });
        }
    }
    if (firstName) {
        user.set({ firstName });
    }
    if (middleName) {
        user.set({ middleName });
    }
    if (surName) {
        user.set({ surName });
    }
    if (req.file) {
        const image = `/uploads/${req.file.filename}`;
        user.set({ image: image });
    }
    await user
        .save()
        .then(result => {
            result = JSON.parse(JSON.stringify(result));
            result.id = result._id;
            delete result._id;
            console.log(result);
            res.json(result);
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.get("/users", checkToken, function(req, res, next) {
    User.find({}, (err, user) => {
        let items = JSON.parse(JSON.stringify(user));
        items.forEach(item => (item.id = item._id));
        res.json(items);
    });
});

router.delete("/users/:id", checkToken, function(req, res, next) {
    User.deleteOne({ _id: req.params.id })
        .then(results => {
            if (results) {
                return res.status(200).json({ message: "User was deleted" });
            }

            return res.status(404).json({ message: "User not found" });
        })
        .catch(err => {
            return res.status(400).json({ message: err.message });
        });
});

router.patch("/users/:id/permission", checkToken, function(req, res, next) {
    const { permission } = req.body;
    User.updateOne({ _id: req.params.id }, { permission })
        .then(results => {
            if (results) {
                return res
                    .status(200)
                    .json({ message: "Permissions was updated" });
            }

            return res.status(404).json({ message: "User not found" });
        })
        .catch(err => {
            return res.status(400).json({ message: err.message });
        });
});

router.get("/news", checkToken, function(req, res, next) {
    getAllNews(res);
});

router.delete("/news/:id", checkToken, async function(req, res, next) {
    News.findOneAndDelete({ _id: req.params.id }, () => {
        getAllNews(res);
    });
});

router.patch("/news/:id", checkToken, async function(req, res, next) {
    News.findOneAndUpdate({ _id: req.params.id }, req.body, () => {
        getAllNews(res);
    });
});

router.post("/news", checkToken, async function(req, res, next) {
    const { text, title } = req.body;
    try {
        const user = await User.findOne({ _id: req.user.userId });
        const article = new News({
            created_at: Date.now(),
            text: text,
            title: title,
            user: {
                firstName: user.firstName,
                id: user._id,
                image: user.image,
                middleName: user.middleName,
                surName: user.surName,
                username: user.username
            }
        });
        article.save().then(article => {
            getAllNews(res);
        });
    } catch (e) {
        console.log(e);
        res.status(400).json({ message: "News Update error" });
    }
});

module.exports = router;
