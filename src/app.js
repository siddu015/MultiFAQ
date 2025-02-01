require("dotenv").config({ path: "../.env" });

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const axios = require("axios");
const session = require("express-session");
const FAQ = require("./models/faqModel");
const redis = require("redis");
const redisClient = redis.createClient();


const app = express();
const port = 8080;
const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multiFAQ";
const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

// Check if API Key is loaded
if (!API_KEY) {
    console.error("ERROR: GOOGLE_CLOUD_API_KEY is missing in .env file!");
    process.exit(1);
}

// Connect to MongoDB
mongoose
    .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB."))
    .catch((err) => {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    });

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Session Middleware (Authentication)
app.use(
    session({
        secret: "your_secret_key", // Change to a strong, random secret
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to `true` if using HTTPS
    })
);

// Google Translate API Function
const translateText = async (text, targetLang) => {
    try {
        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
            {
                q: text,
                source: "en",
                target: targetLang,
                format: "text",
            }
        );

        return response.data.data.translations[0].translatedText;
    } catch (err) {
        console.error(`Translation Error (${targetLang}):`, err.response?.data || err.message);
        return text;
    }
};


// Default Admin Credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password";

// Middleware to Protect Admin Routes
const requireLogin = (req, res, next) => {
    if (!req.session.isAuthenticated) {
        return res.redirect("/admin"); // Redirect to login page if not logged in
    }
    next();
};

// Routes

// Render login page
app.get("/admin", (req, res) => {
    res.render("login");
});

// Handle login form submission
app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAuthenticated = true;
        res.redirect("/admin/dashboard");
    } else {
        res.send("Invalid credentials!");
    }
});

// Logout route
app.get("/admin/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/admin"); // Redirect to login page
    });
});

// Render admin dashboard (Protected)
app.get("/admin/dashboard", requireLogin, async (req, res) => {
    try {
        const faqs = await FAQ.find({});
        res.render("admin", { title: "Admin Dashboard", faqs });
    } catch (err) {
        console.error("Error fetching FAQs:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Add FAQ
app.post("/admin/faq", async (req, res) => {
    const { question, answer } = req.body;

    try {
        // Translate into multiple languages
        const translations = {
            question_en: question,
            answer_en: answer,
            question_te: await translateText(question, "te"),
            answer_te: await translateText(answer, "te"),
            question_kn: await translateText(question, "kn"),
            answer_kn: await translateText(answer, "kn"),
            question_ta: await translateText(question, "ta"),
            answer_ta: await translateText(answer, "ta"),
            question_hi: await translateText(question, "hi"),
            answer_hi: await translateText(answer, "hi"),
        };

        // Save FAQ to database
        const newFAQ = new FAQ({ question, answer, translations });
        await newFAQ.save();

        // Clear Redis cache for all languages
        await Promise.all([
            redisClient.del("faqs:en"),
            redisClient.del("faqs:te"),
            redisClient.del("faqs:kn"),
            redisClient.del("faqs:ta"),
            redisClient.del("faqs:hi")
        ]);

        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("Error saving FAQ:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Render Edit FAQ Form (Protected)
app.get("/admin/faq/:id/edit", requireLogin, async (req, res) => {
    try {
        const faq = await FAQ.findById(req.params.id);
        if (!faq) {
            return res.status(404).send("FAQ not found!");
        }
        res.render("edit-faq", { title: "Edit FAQ", faq });
    } catch (err) {
        console.error("Error fetching FAQ for edit:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Update FAQ
app.post("/admin/faq/:id/edit", async (req, res) => {
    const { question, answer } = req.body;

    try {
        // Translate into multiple languages
        const translations = {
            question_en: question,
            answer_en: answer,
            question_te: await translateText(question, "te"),
            answer_te: await translateText(answer, "te"),
            question_kn: await translateText(question, "kn"),
            answer_kn: await translateText(answer, "kn"),
            question_ta: await translateText(question, "ta"),
            answer_ta: await translateText(answer, "ta"),
            question_hi: await translateText(question, "hi"),
            answer_hi: await translateText(answer, "hi"),
        };

        // Update FAQ in the database
        await FAQ.findByIdAndUpdate(req.params.id, { question, answer, translations });

        // Clear Redis cache for all languages
        await Promise.all([
            redisClient.del("faqs:en"),
            redisClient.del("faqs:te"),
            redisClient.del("faqs:kn"),
            redisClient.del("faqs:ta"),
            redisClient.del("faqs:hi")
        ]);

        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("Error updating FAQ:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Delete FAQ
app.post("/admin/faq/:id/delete", async (req, res) => {
    try {
        // Delete FAQ from the database
        await FAQ.findByIdAndDelete(req.params.id);

        await Promise.all([
            redisClient.del("faqs:en"),
            redisClient.del("faqs:te"),
            redisClient.del("faqs:kn"),
            redisClient.del("faqs:ta"),
            redisClient.del("faqs:hi")
        ]);

        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("Error deleting FAQ:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Serve the user page
app.get("/faqs", (req, res) => {
    res.render("user", { title: "FAQs" });
});

// Fetch FAQs by language
app.get("/api/faqs", async (req, res) => {
    const { lang } = req.query;
    const cacheKey = `faqs:${lang || 'en'}`; // Cache key based on language

    try {
        // Check if data is in Redis cache
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            // Return cached data
            console.log("Serving from cache");
            return res.json(JSON.parse(cachedData));
        }

        // Fetch data from the database
        const faqs = await FAQ.find({});
        const translatedFAQs = faqs.map(faq => faq.getTranslatedText(lang || 'en'));

        // Cache the data in Redis (expire after 1 hour)
        await redisClient.set(cacheKey, JSON.stringify(translatedFAQs), {
            EX: 3600, // Expire after 1 hour (in seconds)
        });

        console.log("Serving from database");
        res.json(translatedFAQs);
    } catch (err) {
        console.error("Error fetching FAQs:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Handle Redis connection errors
redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

// Connect to Redis
redisClient.connect().then(() => {
    console.log("Connected to Redis");
});


// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
