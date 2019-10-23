const mongoose = require("mongoose");
const config = require("../config/config.json");

require("./token");
require("./user");

mongoose.Promise = global.Promise;

mongoose.connect(
    "mongodb+srv://user:1234@cluster0-syugm.azure.mongodb.net/test?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    }
);

mongoose.connection.on("error", err => {
    console.log("Mongoose connection error: " + err);
});

mongoose.connection.on("connected", () => {
    console.log("Mongoose connected");
});

mongoose.connection.on("disconnected", () => {
    console.log("Mongoose disconnected");
});
