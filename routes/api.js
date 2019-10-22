var express = require("express");
var router = express.Router();
var jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = mongoose.model("user");
const config = require("../config/config.json");

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
