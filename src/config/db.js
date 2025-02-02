const mongoose = require("mongoose");
const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multiFAQ";

const connectDB = async() => {
    await mongoose
        .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log("Connected to MongoDB."))
        .catch((err) => {
            console.error("MongoDB Connection Error:", err);
            process.exit(1);
    });
}

module.exports = connectDB;
