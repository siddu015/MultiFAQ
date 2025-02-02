const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const FAQ = require("../src/models/faqModel");

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

afterEach(async () => {
    await FAQ.deleteMany({});
});

describe("FAQ Model Tests", () => {
    test("should create an FAQ entry", async () => {
        const faq = new FAQ({
            question: "What is Node.js?",
            answer: "Node.js is a JavaScript runtime built on Chrome's V8 engine.",
            translations: {
                question_en: "What is Node.js?",
                answer_en: "Node.js is a JavaScript runtime built on Chrome's V8 engine.",
                question_hi: "Node.js क्या है?",
                answer_hi: "Node.js Chrome के V8 इंजन पर आधारित एक जावास्क्रिप्ट रनटाइम है।",
            }
        });

        await faq.save();
        const savedFAQ = await FAQ.findOne({ question: "What is Node.js?" });

        expect(savedFAQ).toBeDefined();
        expect(savedFAQ.answer).toBe("Node.js is a JavaScript runtime built on Chrome's V8 engine.");
    });

    test("should retrieve translated text correctly", async () => {
        const faq = new FAQ({
            question: "What is Express.js?",
            answer: "Express.js is a web framework for Node.js.",
            translations: {
                question_en: "What is Express.js?",
                answer_en: "Express.js is a web framework for Node.js.",
                question_hi: "Express.js क्या है?",
                answer_hi: "Express.js Node.js के लिए एक वेब फ्रेमवर्क है।",
            }
        });

        await faq.save();
        const savedFAQ = await FAQ.findOne({ question: "What is Express.js?" });

        const translatedTextHi = savedFAQ.getTranslatedText("hi");
        expect(translatedTextHi.question).toBe("Express.js क्या है?");
        expect(translatedTextHi.answer).toBe("Express.js Node.js के लिए एक वेब फ्रेमवर्क है।");

        const translatedTextEn = savedFAQ.getTranslatedText("en");
        expect(translatedTextEn.question).toBe("What is Express.js?");
        expect(translatedTextEn.answer).toBe("Express.js is a web framework for Node.js.");
    });

    test("should return default text if translation is missing", async () => {
        const faq = new FAQ({
            question: "What is React?",
            answer: "React is a JavaScript library for building user interfaces.",
        });

        await faq.save();
        const savedFAQ = await FAQ.findOne({ question: "What is React?" });

        const translatedTextTe = savedFAQ.getTranslatedText("te"); // Telugu is missing
        expect(translatedTextTe.question).toBe("What is React?");
        expect(translatedTextTe.answer).toBe("React is a JavaScript library for building user interfaces.");
    });
});
