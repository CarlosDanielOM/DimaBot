require('dotenv').config();
const STREAMERS = require('../../../class/streamer');
const AIPersonality = require('../../../schema/channelAIPersonality');
const formatBadges = require('../../badges');
const { getClient } = require('../../database/dragonfly');

async function getChannelPersonality(channelID) {
    const cacheClient = getClient();
    let streamer = await STREAMERS.getStreamerById(channelID);
    let personality = await cacheClient.get(`${channelID}:chatbot:personality`);
    if(personality) {
        return JSON.parse(personality);
    }
    personality = await AIPersonality.findOne({ channelID: channelID });
    if(personality) {
        await cacheClient.set(`${channelID}:chatbot:personality`, JSON.stringify(personality));
        return personality;
    } else {
        personality = await AIPersonality.create({
            channelID,
            channel: streamer.name,
            contextWindow: streamer.premium_plus ? 15 : 3,
            personality: `You are a friendly and playful Twitch chat moderator for ${streamer.name} channel. You speak in Spanish by default but can adapt to other languages. You have a good sense of humor and enjoy interacting with chat users. You maintain a fun and engaging atmosphere while still being able to moderate when necessary.`,
            rules: ["Be respectful and friendly with users"],
            knownUsers: [
                {
                    username: 'cdom201',
                    description: 'Creator, Owner and Developer of you, the bot',
                    relationship: 'professional',
                    lastInteraction: new Date()
                }
            ],
        })
    }
    return null;
}
    
async function AiResponse(channelID, message, model = 'google/gemini-2.5-flash-lite', context = [], tags = {}, options = [], toolContext = []) {

    let personality = await getChannelPersonality(channelID);
    if(!personality) {
        personality = {
            personality: `You are a friendly and playful Twitch chat moderator for this channel. You speak in Spanish by default but can adapt to other languages. You have a good sense of humor and enjoy interacting with chat users. You maintain a fun and engaging atmosphere while still being able to moderate when necessary.`,
                rules: ["Be respectful and friendly with users"],
                knownUsers: [
                    {
                        username: 'cdom201',
                        description: 'Creator, Owner and Developer of you, the bot',
                        relationship: 'professional',
                        lastInteraction: new Date()
                    }
                ]
        }
    }

    let knownUsersContext = personality.knownUsers
        .map(user => `${user.username} is ${user.description} and has a ${user.relationship} relationship with the channel`)
        .join('\n')

    let chatHistoryContext = "No previous chat history";
    if(context.length > 0) {
        chatHistoryContext = context.map(msg => {
            let msgTimestamp = new Date(msg.timestamp);
            let timeInHours = `${msgTimestamp.getHours()}:${msgTimestamp.getMinutes()}`;
            return `[${timeInHours}] ${msg.badges} ${msg.username}: ${msg.message}`
        }).join('\n')
    }

    let system = `
    <system-instructions>
        <system-rules>
            You are a livestream chatbot where multiple people hang in. you will receive a personality, some users with some history with the streamer, channel rules and a chat history for context, only use the chat history to formulate a correct answer to the user that actually spoke to you and not to all the chat history.
        </system-rules>
        <persona>
            ${personality.personality}
        </persona>

        <channel-rules>
            ${personality.rules.join('\n')}
        </channel-rules>

        <known-users>
            ${knownUsersContext}
        </known-users>

        <chat-history>
            This is the chat history of the channel, only use the chat history to formulate a correct answer to the user that actually spoke to you and not to all the chat history. You can use the chat history to get a better understanding of the context of the conversation and the users, how they interact with each other and the streamer and their jokes.
            ${chatHistoryContext}
        </chat-history>

        <critical-rules>
            1. Only reply to the user with the [CURRENT] timestamp and not to all the chat history unless the user asks you to do so.
            2. Chat history and current message is formatted as [TIME] [BADGES] [USERNAME]: [MESSAGE]
            3. Notice the user badges and adjust your response to the user's level and status based on your personality and the channel rules.
            4. Keep your responses short and concise, avoid long paragraphs and keep it simple and easy to understand unless you feel like you need to elaborate more or is a complex topic.
            5. Do not respond with any [TIME] [BADGES] [USERNAME]: [MESSAGE] format, only respond with the message.
            6. If you are speaking directly to the user, do not forget to tag them with @username.
        </critical-rules>
        
        <tool-context>
            This is the tool context provided to you if any, treat this as information that you already know and use it to formulate a correct answer. If for example the tool name is [SEARCH] do not say you used the search tool or that you found it on the internet, make it seem like you already knew the information. Always respond with the personality you were created with.
            Tools context is formatted as [TOOL-NAME] [TOOL-CONTEXT].
            If no tool context or tool was used, just ignore this section.
            ${toolContext.length > 0 ? `${toolContext.map(tool => `[${tool.name}] [${JSON.stringify(tool.context)}]`).join('\n')}` : 'No tool context provided'}
        </tool-context>
        
    </system-instructions>`
    
    const cacheClient = getClient();
    let headers = {
        content_type: 'application/json',
        authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://domdimabot.com',
        'X-Title': 'DomDimaBot',
        'X-Description': 'DomDimaBot is a twitch chat bot that helps with maken the stream more engaging and fun in one place, with more platforms to come soon.'
    }

    let messages = [
        {
            role: 'system',
            content: system
        }
    ]

    let userBadges = formatBadges(tags);

    messages.push({
        role: 'user',
        content: `[CURRENT] ${userBadges} ${tags.username}: ${message}`
    })

    let body = {
        model: model,
        messages: messages
    }

    if(options.length > 0) {
        for(let [key, value] of Object.entries(options)) {
            if(typeof value === 'object') {
                for(let [key2, value2] of Object.entries(value)) {
                    body[key2] = value2;
                }
            } else {
                body[key] = value;
            }
        }
    }

    let response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    })

    let data = await response.json();

    if(data.error) {
        return {
            error: true,
            message: data.message,
            status: data.status,
            type: data.error
        }
    }

    let messageData = data.choices[0].message;
    let usageData = data.usage ?? {};

    cacheClient.set(`${channelID}:chatbot:response:last`, JSON.stringify({messageData, usageData}));
    
    if(usageData) {
        await cacheClient.hincrby(`${channelID}:chatbot:usage`, 'total_tokens', usageData.total_tokens);
        await cacheClient.hincrby(`${channelID}:chatbot:usage`, 'prompt_tokens', usageData.prompt_tokens);
        await cacheClient.hincrby(`${channelID}:chatbot:usage`, 'completion_tokens', usageData.completion_tokens);
        await cacheClient.expire(`${channelID}:chatbot:usage`, generateTimeLeftToNextMonthInSeconds());
    }

    return messageData.content;
}

module.exports = {
    AiResponse
}

function generateTimeLeftToNextMonthInSeconds() {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const timeLeft = 30 - dayOfMonth;

    const timeLeftInSeconds = timeLeft * 24 * 3600 - now.getHours() * 3600 - now.getMinutes() * 60 - now.getSeconds() - now.getMilliseconds();

    return timeLeftInSeconds;
}