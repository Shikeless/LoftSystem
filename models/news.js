const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
    create_at: {
        type: Date,
        default: Date(Date.now().toString())
    },
    text: String,
    title: String,
    user: {
        firstName: String,
        id: String,
        image: String,
        middleName: String,
        surName: String,
        username: String
    }
});

mongoose.model("news", newsSchema);
