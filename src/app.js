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


const FAQ = require("./models/faqModel");

// Test route to create a sample FAQ
app.get("/test-faq", async (req, res) => {
    const sampleFAQ = new FAQ({
        question: "What is Node.js?",
        answer: "Node.js is a runtime environment for executing JavaScript code outside of a browser.",
        translations: {
            question_te: "Node.js అంటే ఏమిటి?",
            answer_te: "Node.js అనేది బ్రౌజర్ వెలుపల JavaScript కోడ్‌ను అమలు చేయడానికి రన్‌టైం ఎన్విరాన్‌మెంట్.",
            question_kn: "Node.js ಎಂದರೇನು?",
            answer_kn: "Node.js ಎಂಬುದು ಬ್ರೌಸರ್ ಹೊರಗೆ JavaScript ಕೋಡ್ ಅನ್ನು ಕಾರ್ಯಗತಗೊಳಿಸಲು ರನ್‌ಟೈಮ್ ಪರಿಸರವಾಗಿದೆ.",
            question_ta: "Node.js என்றால் என்ன?",
            answer_ta: "Node.js என்பது ஒரு உலாவியின் வெளியே JavaScript குறியீட்டை இயக்குவதற்கான ரன்டைம் சூழல்.",
            question_hi: "Node.js क्या है?",
            answer_hi: "Node.js एक ब्राउज़र के बाहर JavaScript कोड को निष्पादित करने के लिए एक रनटाइम वातावरण है।",
        },
    });

    await sampleFAQ.save();
    res.send("Sample FAQ created successfully!");
});

// Test route to fetch translated FAQ
app.get("/get-faq/:lang", async (req, res) => {
    const { lang } = req.params;
    const faq = await FAQ.findOne({});

    if (!faq) {
        return res.status(404).send("No FAQ found!");
    }

    const translatedFAQ = faq.getTranslatedText(lang);
    res.json(translatedFAQ);
});


// Patch Route
app.listen(port, () => {
    console.log(port, "is running");
});
