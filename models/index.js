const mongoose = require("mongoose");
const config = require("../config/config.json");

require("./token");
require("./user");
require("./news");

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DBURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

mongoose.connection.on("error", err => {
    console.log("Mongoose connection error: " + err);
});

mongoose.connection.on("connected", () => {
    console.log("Mongoose connected");
});

mongoose.connection.on("disconnected", () => {
    console.log("Mongoose disconnected");
});
