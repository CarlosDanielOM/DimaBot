const { getClient } = require("../../util/database/dragonfly");
const { getBotHeader } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function getChannelClips(channelID, amount = null, saveToCache = false) {
    const cacheClient = getClient();

    let cachedClips = await cacheClient.get(`channel:clips:${channelID}`);
    if(cachedClips) {
        return {
            error: false,
            data: JSON.parse(cachedClips)
        }
    }

    let botHeader = await getBotHeader();
    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);
    if(amount) {
        params.append('first', amount);
    }

    let response = await fetch(getTwitchHelixUrl('clips', params), {
        headers: botHeader
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

    if(saveToCache) {
        cacheClient.set(`channel:clips:${channelID}`, JSON.stringify(data.data), 'EX', 60 * 60 * 3);
    }

    return {
        error: false,
        data: data.data
    }
}

module.exports = getChannelClips;