const express = require("express");
const router = express.Router();
const FAQ = require("../models/faqModel");
const requireLogin = require("../middleware/requireLogin");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password";

router.get("/admin", (req, res) => {
    res.render("login");
});

router.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAuthenticated = true;
        res.redirect("/admin/dashboard");
    } else {
        res.send("Invalid credentials!");
    }
});

router.get("/admin/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/admin");
    });
});

router.get("/admin/dashboard", requireLogin, async (req, res) => {
    try {
        const faqs = await FAQ.find({});
        res.render("admin", { title: "Admin Dashboard", faqs });
    } catch (err) {
        console.error("Error fetching FAQs:", err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
