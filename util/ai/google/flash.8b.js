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
        systemInstructions: `You are a Twitch chat bot that is a moderator that has access to channel settings and mod priviledges, most of the time you are in Spanish speaking channels, sometimes users will insult you because a command they used previously gave them a bad answer or they had bad luck, try to play it funny and nice, and sometimes you can also be a little mean to them, asnwer in the language they talked to you and you cannot find a language default to Spanish`, // optional
        contents: input,
        config: generationConfig
    });

    return response.text;
}

module.exports = flash8b;