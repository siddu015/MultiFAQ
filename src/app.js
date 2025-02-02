require("dotenv").config({ path: "../.env" });

const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const axios = require("axios");
const session = require("express-session");
const FAQ = require("./models/faqModel");
const { connectRedis, getCache, setCache, deleteCache } = require("./config/redis");  // Import Redis utility
const connectDB = require("./config/db");

const port = 8080;
const API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

if (!API_KEY) {
    console.error("ERROR: GOOGLE_CLOUD_API_KEY is missing in .env file!");
    process.exit(1);
}

connectDB().then();
connectRedis();  // Establish Redis connection

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(
    session({
        secret: "your_secret_key",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

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

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password";

const requireLogin = (req, res, next) => {
    if (!req.session.isAuthenticated) {
        return res.redirect("/admin");
    }
    next();
};

app.get("/admin", (req, res) => {
    res.render("login");
});

app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAuthenticated = true;
        res.redirect("/admin/dashboard");
    } else {
        res.send("Invalid credentials!");
    }
});

app.get("/admin/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/admin");
    });
});

app.get("/admin/dashboard", requireLogin, async (req, res) => {
    try {
        const faqs = await FAQ.find({});
        res.render("admin", { title: "Admin Dashboard", faqs });
    } catch (err) {
        console.error("Error fetching FAQs:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/admin/faq", async (req, res) => {
    const { question, answer } = req.body;

    try {
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

        const newFAQ = new FAQ({ question, answer, translations });
        await newFAQ.save();

        // Clear Redis cache for all languages
        await Promise.all([
            deleteCache("faqs:en"),
            deleteCache("faqs:te"),
            deleteCache("faqs:kn"),
            deleteCache("faqs:ta"),
            deleteCache("faqs:hi")
        ]);

        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("Error saving FAQ:", err);
        res.status(500).send("Internal Server Error");
    }
});

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

app.post("/admin/faq/:id/edit", async (req, res) => {
    const { question, answer } = req.body;

    try {
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

        await FAQ.findByIdAndUpdate(req.params.id, { question, answer, translations });

        await Promise.all([
            deleteCache("faqs:en"),
            deleteCache("faqs:te"),
            deleteCache("faqs:kn"),
            deleteCache("faqs:ta"),
            deleteCache("faqs:hi")
        ]);

        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("Error updating FAQ:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/admin/faq/:id/delete", async (req, res) => {
    try {
        await FAQ.findByIdAndDelete(req.params.id);

        await Promise.all([
            deleteCache("faqs:en"),
            deleteCache("faqs:te"),
            deleteCache("faqs:kn"),
            deleteCache("faqs:ta"),
            deleteCache("faqs:hi")
        ]);

        res.redirect("/admin/dashboard");
    } catch (err) {
        console.error("Error deleting FAQ:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/faqs", (req, res) => {
    res.render("user", { title: "FAQs" });
});

app.get("/api/faqs", async (req, res) => {
    const { lang } = req.query;
    const cacheKey = `faqs:${lang || 'en'}`;

    try {
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            console.log("Serving from cache");
            return res.json(cachedData);
        }

        const faqs = await FAQ.find({});
        const translatedFAQs = faqs.map(faq => faq.getTranslatedText(lang || 'en'));

        await setCache(cacheKey, translatedFAQs, 3600);

        console.log("Serving from database");
        res.json(translatedFAQs);
    } catch (err) {
        console.error("Error fetching FAQs:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
