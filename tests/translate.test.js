// translate.test.js
const translateText = require("../src/utils/translate");
const axios = require("axios");

jest.mock("axios");

describe("translateText", () => {
    it("should translate text correctly", async () => {
        const text = "Hello, how are you?";
        const targetLang = "es";
        const translatedText = "Hola, ¿cómo estás?";

        axios.post.mockResolvedValue({
            data: {
                data: {
                    translations: [{ translatedText }],
                },
            },
        });

        const result = await translateText(text, targetLang);

        expect(result).toBe(translatedText);
        expect(axios.post).toHaveBeenCalledWith(
            `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
            {
                q: text,
                source: "en",
                target: targetLang,
                format: "text",
            }
        );
    });

    it("should handle errors gracefully", async () => {
        const text = "Hello, how are you?";
        const targetLang = "es";

        axios.post.mockRejectedValue(new Error("API Error"));

        const result = await translateText(text, targetLang);

        expect(result).toBe(text); // Returns original text on error
    });
});
