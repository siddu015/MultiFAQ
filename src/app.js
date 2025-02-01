require("dotenv").config({ path: "../.env" });

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const axios = require("axios");
const FAQ = require("./models/faqModel");

const app = express();
const port = 8080;
const MONGO_URL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/multiFAQ";
const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

// Check if API Key is loaded
if (!API_KEY) {
    console.error("ERROR: GOOGLE_CLOUD_API_KEY is missing in .env file!");
    process.exit(1); // Stop execution if API key is missing
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
// app.use('/ckeditor', express.static(path.join(__dirname, 'node_modules', '@ckeditor', 'ckeditor5-build-classic', 'build')));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

// Google Translate API Function (Using Axios)
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
        return text; // Return original text if translation fails
    }
};

// Default Admin Credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password";

// Routes

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
app.get("/admin/dashboard", async (req, res) => {
    try {
        const faqs = await FAQ.find({});
        res.render("admin", { title: "Admin Dashboard", faqs });
    } catch (err) {
        console.error("Error fetching FAQs:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Handle FAQ form submission
app.post("/admin/faq", async (req, res) => {
    const { question, answer } = req.body;

    console.log(req.body);
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
        await FAQ({ question, answer, translations }).save();

        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("Error saving FAQ:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Render edit form
app.get("/admin/faq/:id/edit", async (req, res) => {
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

// Handle edit form submission
app.post("/admin/faq/:id/edit", async (req, res) => {
    const { question, answer } = req.body;

    try {
        // Translate the updated question and answer into all languages
        const translations = {
            question_en: question, // English (original)
            answer_en: answer,     // English (original)
            question_te: await translateText(question, "te"), // Telugu
            answer_te: await translateText(answer, "te"),
            question_kn: await translateText(question, "kn"), // Kannada
            answer_kn: await translateText(answer, "kn"),
            question_ta: await translateText(question, "ta"), // Tamil
            answer_ta: await translateText(answer, "ta"),
            question_hi: await translateText(question, "hi"), // Hindi
            answer_hi: await translateText(answer, "hi"),
        };

        // Update the FAQ in the database
        await FAQ.findByIdAndUpdate(req.params.id, { question, answer, translations });

        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("Error updating FAQ:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Handle delete form submission
app.post("/admin/faq/:id/delete", async (req, res) => {
    try {
        await FAQ.findByIdAndDelete(req.params.id);
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

    try {
        const faqs = await FAQ.find({});
        const translatedFAQs = faqs.map(faq => faq.getTranslatedText(lang || 'en'));
        res.json(translatedFAQs);
    } catch (err) {
        console.error("Error fetching FAQs:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


