const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    translations: {
        question_en: String, // English
        answer_en: String,
        question_te: String, // Telugu
        answer_te: String,
        question_kn: String, // Kannada
        answer_kn: String,
        question_ta: String, // Tamil
        answer_ta: String,
        question_hi: String, // Hindi
        answer_hi: String,
    },
});

// Method to get translated text based on language
faqSchema.methods.getTranslatedText = function (lang) {
    const translation = {
        question: this.translations[`question_${lang}`] || this.question,
        answer: this.translations[`answer_${lang}`] || this.answer,
    };
    return translation;
};

const FAQ = mongoose.model("FAQ", faqSchema);

module.exports = FAQ;
