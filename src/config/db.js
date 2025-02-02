const mongoose = require("mongoose");
const MONGO_URL = process.env.MONGO_URI;

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
