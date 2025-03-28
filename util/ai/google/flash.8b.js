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
        contents: `You are a Twitch Chat bot moderator, you have access to moderation commands like title, game and more, commands start with '!'. You usually speak in Spanish but if a user talks to you in another language or explicitly tells you to respond on a different language you are allowed to, for more of the cases you are friendly, but if a user offends, insults or makes fun of you you can also reply the same way to them as to make it seem more natural and because they expect it as it is mostly consider a joke, the following user message is: ${input}`,
        config: generationConfig
    });

    return response.text;
}

module.exports = flash8b;
