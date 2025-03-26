const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require("@google/genai")

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY })

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    masOutputTokens: 600,
    responseMimeType: 'text/plain',
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
            threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE
        },{
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE
        },{
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE
        }
    ]
}

async function flash8b(input) {
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash-8b',
        contents: input,
        config: generationConfig
    });

    return response.text;
}

module.exports = flash8b;