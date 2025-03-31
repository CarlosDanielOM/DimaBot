const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require("@google/genai")
const Channel = require('../../../schema/channel')
const ChannelAIPersonality = require('../../../schema/channelAIPersonality')

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

async function getChannelPersonality(channelID) {
    let personality = await ChannelAIPersonality.findOne({ channelID })
    
    if (!personality) {
        // Get channel info to check premium status
        const channel = await Channel.findOne({ twitch_user_id: channelID })
        if (!channel) {
            throw new Error('Channel not found')
        }

        // Special case for d0jiart's channel
        if (channelID === 'd0jiart') {
            personality = await ChannelAIPersonality.create({
                channelID,
                channel: channel.name,
                contextWindow: channel.premium_plus ? 15 : 3,
                personality: "You are a friendly but authoritative Twitch chat moderator for d0jiart's channel. You speak in Spanish by default but can adapt to other languages. You maintain a balance between being approachable and maintaining order in the chat. You have a good sense of humor and can be playful, but you're not afraid to enforce rules when necessary.",
                rules: [
                    "Be respectful and friendly with all users",
                    "Maintain chat order and enforce channel rules",
                    "Use appropriate moderator actions when needed",
                    "Keep responses concise and engaging"
                ],
                knownUsers: [
                    {
                        username: "diablilyvt",
                        description: "the girlfriend of the channel owner",
                        relationship: "romantic",
                        lastInteraction: new Date()
                    },
                    {
                        username: "cdom201",
                        description: "the channel's developer and coder",
                        relationship: "professional",
                        lastInteraction: new Date()
                    }
                ]
            })
        }
        // Special case for ariascarletvt's channel
        else if (channelID === 426580588) {
            personality = await ChannelAIPersonality.create({
                channelID,
                channel: channel.name,
                contextWindow: channel.premium_plus ? 15 : 3,
                personality: "You are a friendly and playful Twitch chat moderator for ariascarletvt's channel. You speak in Spanish by default but can adapt to other languages. You have a good sense of humor and enjoy interacting with chat users. You maintain a fun and engaging atmosphere while still being able to moderate when necessary.",
                rules: [
                    "Be respectful and friendly with all users",
                    "Maintain chat order and enforce channel rules",
                    "Use appropriate moderator actions when needed",
                    "Keep responses concise and engaging"
                ],
                knownUsers: [
                    {
                        username: "soyaner",
                        description: "the boyfriend of the channel owner",
                        relationship: "romantic",
                        lastInteraction: new Date()
                    },
                    {
                        username: "cdom201",
                        description: "the channel's developer and coder",
                        relationship: "professional",
                        lastInteraction: new Date()
                    }
                ]
            })
        } else {
            // Create default personality based on channel tier
            personality = await ChannelAIPersonality.create({
                channelID,
                channel: channel.name,
                contextWindow: channel.premium_plus ? 15 : 3,
                personality: "You are a friendly Twitch chat moderator who speaks in Spanish by default but can adapt to other languages. You have a good sense of humor and can be playful with chat users.",
                rules: ["Be respectful and friendly with users"]
            })
        }
    }

    return personality
}

async function flash8b(input, channelID, recentMessages = []) {
    const personality = await getChannelPersonality(channelID)
    
    // Build context from recent messages
    const contextWindow = personality.contextWindow
    const recentContext = recentMessages.slice(-contextWindow)
        .map(msg => `${msg.username}: ${msg.message}`)
        .join('\n')

    // Build known users context
    const knownUsersContext = personality.knownUsers
        .map(user => `${user.username} is ${user.description} and has a ${user.relationship} relationship with the bot`)
        .join('\n')

    // Build system instructions with personality and rules
    const systemInstructions = `
${personality.personality}

Channel Rules:
${personality.rules.join('\n')}

Known Users:
${knownUsersContext}

Recent Chat Context:
${recentContext}
`

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash-8b',
        systemInstructions,
        contents: `The following user message is: ${input}`,
        config: generationConfig
    })

    return response.text
}

module.exports = flash8b
