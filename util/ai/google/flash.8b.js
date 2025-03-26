const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY })

async function flash8b(input) {
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash-8b',
        contents: input,
    });

    return response.text;
}

module.exports = flash8b;