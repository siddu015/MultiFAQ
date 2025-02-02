const express = require("express");
const router = express.Router();
const FAQ = require("../models/faqModel");
const requireLogin = require("../middleware/requireLogin");
const {getCache, setCache, deleteCache } = require("../config/redis");  // Import Redis utility
const translateText = require("../utils/translate");

router.get("/", async (req, res) => {
    res.redirect("/faqs");
});

router.post("/admin/faq", async (req, res) => {
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

router.get("/admin/faq/:id/edit", requireLogin, async (req, res) => {
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

router.post("/admin/faq/:id/edit", async (req, res) => {
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

router.post("/admin/faq/:id/delete", async (req, res) => {
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

router.get("/faqs", (req, res) => {
    res.render("user", { title: "FAQs" });
});

router.get("/api/faqs", async (req, res) => {
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

module.exports = router;
