const CHAT = require('../chat');
const { searchGameById } = require('../search/game');
const { getUrl } = require('../../util/dev');
const logger = require('../../util/logger');
const { getClient } = require('../../util/database/dragonfly');
const promo = require('../../command/promo');

async function showClip(channelID, clipData, streamerData, streamerChannelData) {
    const cacheClient = getClient();
    if(!clipData || !streamerData || !streamerChannelData) {
        logger({error: true, message: "Missing parameters", status: 400, type: "missing_parameters", channelID}, true, channelID, 'showClip missing_parameters');
        return {
            error: true,
            message: "Missing parameters",
            status: 400,
            type: "missing_parameters"
        }
    }

    let streamerID = streamerData.id;

    let streamerColor = await CHAT.getUserColor(streamerID);
    if(streamerColor.error) {
        logger(streamerColor, true, channelID, 'showClip streamerColor');
        return streamerColor;
    }

    let randomClipNumber = Math.floor(Math.random() * clipData.length);
    let randomClip = clipData[randomClipNumber];

    if(!randomClip) {
        logger({error: true, message: "Clip not found", status: 404, type: "clip_not_found", channelID}, true, channelID, 'showClip clip_not_found');
        retryClip(channelID);

        return {
            error: true,
            message: "Clip not found",
            status: 404,
            type: "clip_not_found"
        }
    }
    
    let duration = randomClip.duration || null;
    let clipUrl = randomClip.url || null;

    if (!duration || !clipUrl) {
        logger({error: true, message: "Missing parameters", status: 400, type: "missing_parameters", channelID}, true, channelID, 'showClip missing_parameters');
        retryClip(channelID);

        return {
            error: true,
            message: "Missing parameters",
            status: 400,
            type: "missing_parameters"
        }
    }

    let clipGame = await searchGameById(randomClip.game_id);

    if(clipGame.error) {
        logger({error: true, message: "Game not found", status: 404, type: "game_not_found", channelID}, true, channelID, 'showClip game_not_found');
        retryClip(channelID);

        return {
            error: true,
            message: "Game not found",
            status: 404,
            type: "game_not_found"
        }
    }

    let clipResponse = await fetch(`${getUrl()}/clip/${channelID}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            duration,
            clipUrl,
            title: streamerChannelData.title,
            game: clipGame.data.name,
            streamer: streamerData.display_name,
            profileImage: streamerData.profile_image_url,
            description: streamerData.description,
            streamerColor: streamerColor,
        })
    })

    let data = await clipResponse.json();

    if(data.error) {
        logger(data, true, channelID, 'showClip');
        retryClip(channelID);

        return data;
    }

    return data;
    
}

module.exports = showClip;

async function retryClip(channelID) {
    const cacheClient = getClient();
    cacheClient.lpop(`${channelID}:clips:queue`);
    cacheClient.del(`${channelID}:clips:queue:first`);
    cacheClient.del(`${channelID}:clip:playing`);

    if(cacheClient.exists(`${channelID}:clips:queue`)) {
        let nextStreamer = await cacheClient.lpop(`${channelID}:clips:queue`);
        if(nextStreamer) {
            promo(channelID, nextStreamer, true);
        } else {
            cacheClient.del(`${channelID}:clip:playing`);
        }
    }

    return {
        error: false,
        message: "Clip retried",
    }
}