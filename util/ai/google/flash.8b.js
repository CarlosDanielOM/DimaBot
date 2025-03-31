const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require("@google/genai")
const Channel = require('../../../schema/channel')
const ChannelAIPersonality = require('../../../schema/channelAIPersonality')
const COMMANDS = require('../../../command')
const { getClient } = require('../../../util/database/dragonfly')

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
                personality: "You are a friendly Twitch chat moderator who speaks in Spanish by default but can adapt to other languages. You have a good sense of humor and can be playful with chat users.",
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

async function handleCommand(channelID, command, argument, username, tags) {
    // Get user's level
    const userLevel = await getUserLevel(channelID, username, tags);
    
    // Check if user has required level (7 for mod commands)
    if (userLevel < 7) {
        return {
            error: true,
            message: 'You do not have permission to use this command. Only moderators and above can use it.',
            status: 403,
            type: 'insufficient_permissions'
        };
    }

    let commandResult;

    switch(command) {
        case 'title':
            commandResult = await COMMANDS.title(channelID, argument, userLevel);
            break;
        case 'game':
            commandResult = await COMMANDS.game(channelID, argument, userLevel);
            break;
        default:
            return {
                error: true,
                message: 'Command not recognized',
                status: 404,
                type: 'command_not_found'
            };
    }

    return commandResult;
}

async function flash8b(input, channelID, recentMessages = [], username, tags) {
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

    // Check if the input contains a command request
    const commandMatch = input.match(/!(\w+)\s*(.*)/);
    let commandResult = null;
    
    if (commandMatch) {
        const [_, command, argument] = commandMatch;
        commandResult = await handleCommand(channelID, command, argument, username, tags);
    }

    // Build system instructions with personality, rules, and command awareness
    const systemInstructions = `
${personality.personality}

Channel Rules:
${personality.rules.join('\n')}

Known Users:
${knownUsersContext}

Available Commands:
- !title [new title] - Change the stream title (Moderator+ only)
- !game [game name] - Change the current game category (Moderator+ only)

Recent Chat Context:
${recentContext}

You are able to understand and execute Twitch commands. When a moderator asks to change the title or game, you should use the appropriate command. For example:
- If asked to change title: Use !title command
- If asked to change game: Use !game command

Always verify the user has moderator privileges before executing commands.

When a command is executed, you should respond with a friendly message in the respective language of the channel that:
1. Acknowledges the action taken
2. Uses the command's result message
3. Maintains your personality and tone
4. Is concise and engaging

For example:
- If title change succeeds: "¡Listo! [command result message]"
- If game change succeeds: "¡Listo! [command result message]"
- If command fails: "Lo siento, [command error message]"
`

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash-8b',
        contents: `${systemInstructions}\n\nThe following user message is: ${input}${commandResult ? `\n\nCommand result: ${commandResult.message}` : ''}`,
        config: generationConfig
    })

    return response.text
}

module.exports = flash8b
