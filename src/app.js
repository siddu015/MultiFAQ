const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const FAQ = require("./models/faqModel");

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

// Default credentials for admin login
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password";

// Render login page
app.get("/admin", (req, res) => {
    res.render("login");
});

// Handle login form submission
app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.redirect("/admin/dashboard");
    } else {
        res.send("Invalid credentials!");
    }
});

// Render admin dashboard
app.get("/admin/dashboard", (req, res) => {
    res.render("admin", { title: "Admin Dashboard" });
});

// Handle FAQ form submission
app.post("/admin/faq", async (req, res) => {
    const { question, answer } = req.body;
    const newFAQ = new FAQ({ question, answer });
    await newFAQ.save();
    res.redirect("/admin/dashboard");
});



// Server Start
app.listen(port, () => {
    console.log(port, "is running");
});
