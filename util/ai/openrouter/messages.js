require('dotenv').config();
const STREAMERS = require('../../../class/streamer');
const AIPersonality = require('../../../schema/channelAIPersonality');
const { getClient } = require('../../database/dragonfly');

async function getChannelPersonality(channelID) {
    const cacheClient = getClient();
    let personality = await cacheClient.get(`${channelID}:chatbot:personality`);
    if(personality) {
        return JSON.parse(personality);
    }
    personality = await AIPersonality.findOne({ channelID: channelID });
    if(personality) {
        await cacheClient.set(`${channelID}:chatbot:personality`, JSON.stringify(personality));
        return personality;
    }
    return null;
}
    
async function AiResponse(channelID, message, model = 'google/gemini-2.5-flash-lite', context = [], tags = {}, options = [] ) {

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

    let system = `
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
    </system-instructions>`
    
    const cacheClient = getClient();
    let headers = {
        content_type: 'application/json',
        authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://domdimabot.com',
        'X-Title': 'DomDimaBot'
    }

    let messages = [
        {
            role: 'system',
            content: system
        }
    ]

    if(context.length > 0) {
        for(let i = 0; i < context.length; i++) {
            messages.push({
                role: 'user',
                content: `{"username": "${context[i].username}", "message": "${context[i].message}"}`
            })
        }
    }

    messages.push({
        role: 'user',
        content: `{"username": "${tags.username}", "message": "${message}"}`
    })

    let body = {
        model: model,
        messages: messages
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