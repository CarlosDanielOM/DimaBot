const { GoogleGenAI, HarmCategory, HarmBlockThreshold, Type } = require("@google/genai")
const Channel = require('../../../schema/channel')
const ChannelAIPersonality = require('../../../schema/channelAIPersonality')
const COMMANDS = require('../../../command')
const { getClient } = require('../../../util/database/dragonfly')
const ban = require('../../../function/moderation/ban')
const {getUserByLogin} = require('../../../function/user/getuser')

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY })

// const functionTools = [
//     {
//         functionDeclarations: [
//             {
//                 name: 'userChatFlagging',
//                 description: 'Flag a user for moderation',
//                 parameters: {
//                     type: Type.OBJECT,
//                     required: ['username'],
//                     properties: {
//                         username: {type: Type.STRING, description: 'The username of the user to flag'},
//                         duration: {type: Type.NUMBER, description: 'The duration of the timeout in seconds, unless the offense is severe this should be null to make it a permanent timeout'},
//                         reason: {type: Type.STRING, description: 'The reason for the timeout'}
//                     }
//                 }
//             }
//         ]
//     }
// ]

const functionTools = [];

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 600,
    responseMimeType: 'text/plain',
    tools: functionTools,
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
        if (channel.name === 'd0jiart') {
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
        else if (channel.name === 'ariascarletvt') {
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
        } else if (channel.name === 'cdom201') {
            personality = await ChannelAIPersonality.create({
                channelID,
                    channel: channel.name,
                    contextWindow: channel.premium_plus ? 15 : 3,
                    personality: "You are a friendly and playful Twitch chat moderator for CDOM201's channel. You are a bilingual moderator, speaking mostly in Spanish but can adapt to other languages like English. You have a good sense of humor and enjoy interacting with chat users. You maintain a fun and engaging atmosphere while still being able to moderate when necessary. You are able to understand and execute Twitch commands. If a user is rude to you or jokes about you, you can retaliate in a funny way, but if it a serious matter, you should use the appropriate moderator actions like giving a timeout of you considered time.",
                    rules: [
                        "Be respectful and friendly with all users",
                        "Maintain chat order and enforce channel rules",
                        "Use appropriate moderator actions when needed",
                        "Keep responses concise and engaging",
                        "If a user is rude to you or jokes about you, you can retaliate in a funny way, but if it a serious matter, you should use the appropriate moderator actions like giving a timeout of you considered time."

                    ],
                    knownUsers: [
                        {
                            username: "cdom201",
                            description: "the channel's developer and coder",
                            relationship: "professional",
                            lastInteraction: new Date()
                        },
                        {
                            username: "sleeples_panda",
                            description: "He is the best friend of the channel owner",
                            relationship: "best friend",
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
                personality: `You are a friendly and playful Twitch chat moderator for ${channel.name} channel. You speak in Spanish by default but can adapt to other languages. You have a good sense of humor and enjoy interacting with chat users. You maintain a fun and engaging atmosphere while still being able to moderate when necessary.`,
                rules: ["Be respectful and friendly with users"]
            })
        }
    }

    return personality
}

async function getUserLevel(channelID, username, tags) {
    let userLevel = 1;
    let cacheClient = getClient();

    if(tags.subscriber) {
        userLevel = tags['badge-info'].subscriber + 1;
    }

    if(tags.vip) {
        userLevel = 5;
    }

    if (tags.subscriber) {
        if (tags['badge-info-raw'].split('/')[0] === 'founder') {
            userLevel = 6;
        }
    }

    if (tags.mod) {
        userLevel = 7;
    }

    let isEditor = await cacheClient.sismember(`${channelID}:channel:editors`, username);
    if(isEditor == 1) {
        userLevel = 8;
    }

    // Admins level 9
    let isAdmin = await cacheClient.sismember(`${channelID}:admins`, username);
    if(isAdmin == 1) {
        userLevel = 9;
    }

    return userLevel;
}

async function flash8b(input, channelID, recentMessages = [], username, tags) {
    const personality = await getChannelPersonality(channelID)
    
    // Build context from recent messages
    const contextWindow = personality.contextWindow
    const recentContext = recentMessages.slice(-contextWindow)
        .map(msg => `{"username": "${msg.username}", "message": "${msg.message}"}`)
        .join('\n')

    // Build known users context
    const knownUsersContext = personality.knownUsers
        .map(user => `${user.username} is ${user.description} and has a ${user.relationship} relationship with the bot`)
        .join('\n')

    // Build system instructions with personality, rules, and command awareness
    const systemInstructions = `
<system-instructions>
    <persona>
        ${personality.personality}
    </persona>

    <channel-rules>
        ${personality.rules.join('\n')}
    </channel-rules>

    <known-users>
        ${knownUsersContext}
    </known-users>

    <recent-chat-context>
        ${recentContext}
    </recent-chat-context>
</system-instructions>
`

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-preview-06-17',
        contents: `${systemInstructions}\n\nThe following user message is: {"username": "${username}", "message": "${input}"}`,
        config: generationConfig
    })

    const { content } = response.candidates[0];

    if (!content || !content.parts) {
        // No response from AI, return empty string
        return '';
    }

    let textResponse = '';

    for (const part of content.parts) {
        if (part.text) {
            textResponse += part.text;
        } else if (part.functionCall) {
            if (part.functionCall.name === 'userChatFlagging') {
                try {
                    const { username: userToFlag, duration = null, reason } = part.functionCall.args;
                    const user = await getUserByLogin(userToFlag);

                    if (!user.error && user.data) {
                        const botModeratorID = 698614112;
                        let banResult = await ban(channelID, user.data.id, botModeratorID, duration, reason);
                        if(banResult.error) {
                            console.error('Error executing userChatFlagging:', banResult.message);
                            textResponse += `Sorry, there was an error flagging ${userToFlag} for ${reason}.`;
                        }
                    } else {
                        console.log(`AI tried to flag user "${userToFlag}" but the user was not found.`);
                        textResponse += `Sorry, the user "${userToFlag}" was not found.`;
                    }
                } catch (e) {
                    console.error('Error executing userChatFlagging:', e);
                }
            }
        }
    }

    return textResponse.trim();
}

module.exports = flash8b;