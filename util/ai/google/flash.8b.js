const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require("@google/genai")
const Channel = require('../../../schema/channel')
const ChannelAIPersonality = require('../../../schema/channelAIPersonality')
const COMMANDS = require('../../../command')
const { getClient } = require('../../../util/database/dragonfly')
const ban = require('../../../function/moderation/ban')
const {getUserByLogin} = require('../../../function/user/getuser')

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
        case 'timeout':
            // Parse timeout duration and reason
            const [targetUser, duration, ...reasonParts] = argument.split(' ');
            const reason = reasonParts.join(' ');
            
            if (!targetUser || !duration) {
                return {
                    error: true,
                    message: 'Usage: !timeout <username> <duration> [reason]',
                    status: 400,
                    type: 'invalid_arguments'
                };
            }

            // Convert duration to seconds (e.g., "5m" -> 300 seconds)
            let timeoutSeconds = 0;
            const durationMatch = duration.match(/^(\d+)([smhd])$/);
            if (durationMatch) {
                const [, amount, unit] = durationMatch;
                switch (unit) {
                    case 's': timeoutSeconds = parseInt(amount); break;
                    case 'm': timeoutSeconds = parseInt(amount) * 60; break;
                    case 'h': timeoutSeconds = parseInt(amount) * 3600; break;
                    case 'd': timeoutSeconds = parseInt(amount) * 86400; break;
                }
            } else {
                timeoutSeconds = parseInt(duration);
            }

            if (isNaN(timeoutSeconds) || timeoutSeconds <= 0) {
                return {
                    error: true,
                    message: 'Invalid duration format. Use number followed by s/m/h/d (e.g., 5m, 1h)',
                    status: 400,
                    type: 'invalid_duration'
                };
            }

            // Get target user's ID
            const targetUserData = await getUserByLogin(targetUser);
            if (targetUserData.error) {
                return {
                    error: true,
                    message: `User ${targetUser} not found`,
                    status: 404,
                    type: 'user_not_found'
                };
            }

            // Check if target is a moderator or higher
            const targetUserLevel = await getUserLevel(channelID, targetUser, { username: targetUser });
            if (targetUserLevel >= 7) {
                return {
                    error: true,
                    message: 'Cannot timeout moderators or higher',
                    status: 403,
                    type: 'cannot_timeout_mod'
                };
            }

            // Execute timeout
            commandResult = await ban(channelID, targetUserData.data.id, tags['user-id'], timeoutSeconds, reason || 'Timeout by AI moderator');
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

async function handleAITimeout(channelID, username, message, personality) {
    // Get user's level
    const userLevel = await getUserLevel(channelID, username, { username });
    
    // Don't timeout moderators or higher
    if (userLevel >= 7) {
        return null;
    }

    // Get user's ID
    const userData = await getUserByLogin(username);
    if (userData.error) {
        return null;
    }

    // Check for violations with more specific patterns
    let timeoutSeconds = 0;
    let reason = '';

    // Severe violations (1 hour)
    if (message.match(/\b(hate speech|harassment|threats|spam)\b/i)) {
        timeoutSeconds = 3600;
        reason = 'Severe rule violation';
    }
    // Moderate violations (15 minutes)
    else if (message.match(/\b(excessive caps|repeated emotes|offensive language)\b/i)) {
        timeoutSeconds = 900;
        reason = 'Moderate rule violation';
    }
    // Minor violations (5 minutes)
    else if (message.match(/\b(excessive punctuation|single emote spam)\b/i)) {
        timeoutSeconds = 300;
        reason = 'Minor rule violation';
    }

    // Only execute timeout if we found a violation
    if (timeoutSeconds > 0) {
        return await ban(channelID, userData.data.id, '698614112', timeoutSeconds, reason || 'AI timeout');
    }

    return null;
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
    } else {
        // Only check for violations if the message is not a command
        const timeoutResult = await handleAITimeout(channelID, username, input, personality);
        if (timeoutResult) {
            commandResult = timeoutResult;
        }
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
- !timeout [username] [duration] [reason] - Timeout a user (Moderator+ only)
  Duration format: number followed by s/m/h/d (e.g., 5m, 1h)
  Example: !timeout user123 5m Spam in chat

Recent Chat Context:
${recentContext}

You are able to understand and execute Twitch commands. When a moderator asks to change the title, game, or timeout a user, you should use the appropriate command. For example:
- If asked to change title: Use !title command
- If asked to change game: Use !game command
- If asked to timeout a user: Use !timeout command with appropriate duration based on severity

You also have the ability to autonomously detect and act on rule violations. When you detect a violation:
1. Assess the severity of the violation
2. Apply appropriate timeout duration:
   - Minor violations: 5 minutes
   - Moderate violations: 15 minutes
   - Severe violations: 1 hour
3. Do not timeout moderators or higher-level users
4. Respond with a friendly but firm message explaining the action

When a command is executed, you should respond with a friendly message in Spanish that:
1. Acknowledges the action taken
2. Uses the command's result message
3. Maintains your personality and tone
4. Is concise and engaging

For example:
- If title change succeeds: "¡Listo! [command result message]"
- If game change succeeds: "¡Listo! [command result message]"
- If timeout succeeds: "¡Listo! [command result message]"
- If command fails: "Lo siento, [command error message]"
`

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-preview-06-17',
        contents: `${systemInstructions}\n\nThe following user message is: ${input}${commandResult ? `\n\nCommand result: ${commandResult.message}` : ''}`,
        config: generationConfig
    })

    return response.text
}

module.exports = flash8b
