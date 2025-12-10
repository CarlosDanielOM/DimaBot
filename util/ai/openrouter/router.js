const { getClient } = require('../../database/dragonfly');
const logger = require('../../logger');
const { AiResponse } = require('./messages');

require('dotenv').config();

async function router(channelID, message, preset = '@preset/router', history = [], tags = {}, options = [], streamer) {
    const cacheClient = getClient();
    let toolContext = [];
    let headers = {
        content_type: 'application/json',
        authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://domdimabot.com',
        'X-Title': 'DomDimaBot',
        'X-Description': 'DomDimaBot is a twitch chat bot that helps with maken the stream more engaging and fun in one place, with more platforms to come soon.'
    }

    let now = new Date();
    let date = now.toLocaleString('en-US', {timeZone: 'UTC'});

    let response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            model: preset,
            messages: [
                {
                    role: 'user',
                    content: `[${date}] ${message}`
                }
            ],
            response_format: { type: 'json_object' },
            user: `${channelID}`
        })
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
    // return data.choices[0].message.content;

    let aiDecision = JSON.parse(data.choices[0].message.content);

    if(aiDecision.action == 'search') {
        let queries = new URLSearchParams();
        queries.append('q', aiDecision.query);
        queries.append('format', 'json');

        let results = await fetch('https://search.myhomelab.wtf/search?' + queries);

        let resultsData = await results.json();

        if(resultsData.error) {
            return {
                error: true,
                message: resultsData.message,
                status: resultsData.status,
                type: resultsData.error
            }
        }

        results = resultsData.results.slice(0, 3);

        results = results.map(result => {
            return {
                title: result.title,
                url: result.url,
                content: result.content,
                score: result.score
            }
        })

        toolContext.push({
            name: 'search',
            context: results
        })

        // logger({channelID, message, toolContext, aiDecision}, true, channelID, 'router');
    }

    let model = 'sao10k/l3-lunaris-8b';
    if(streamer.premium == "true" || streamer.premium_plus == "true") {
        model = 'moonshotai/kimi-k2-thinking:nitro';
    }

    let AiAnswer = await AiResponse(channelID, message, model, history, tags, options, toolContext);

    return {
        error: false,
        message: AiAnswer
    };
}

module.exports = router;