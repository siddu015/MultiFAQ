require("dotenv").config({ path: "../.env" });

const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const { connectRedis} = require("./config/redis");
const connectDB = require("./config/db");

const adminRoutes = require("./routes/adminRoutes");
const faqRoutes = require("./routes/faqRoutes");

connectDB().then();   // Establish Mongoose connection
connectRedis().then();  // Establish Redis connection

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(
    session({
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

app.use(adminRoutes);
app.use(faqRoutes);

const port = 8080;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
