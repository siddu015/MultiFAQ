const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");


const port = 8080;
const MONGO_URL = "mongodb://127.0.0.1:27017/multiFAQ";

main()
    .then(() => {
        console.log("Connected to DB.");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


app.get('/', (req, res) => {
    res.send("Hello World!");
})

// Patch Route
app.listen(port, () => {
    console.log(port, "is running");
});
