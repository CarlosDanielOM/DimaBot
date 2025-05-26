const STREAMERS = require('../../class/streamer')
const { getStreamerHeaderById, getBotHeader } = require('../../util/header')
const { getTwitchHelixUrl } = require('../../util/link')
const { getClient } = require('../../util/database/dragonfly');

async function getChannelInformation(channelID, saveToCache = false) {
    const cacheClient = getClient();

    let cachedChannel = await cacheClient.get(`channel:data:${channelID}`);
    if(cachedChannel) {
        return {
            error: false,
            data: JSON.parse(cachedChannel)
        }
    }
    
    // let streamerHeader = await getStreamerHeaderById(channelID)
    let botHeader = await getBotHeader();

    let params = new URLSearchParams({
        broadcaster_id: channelID
    })

    let response = await fetch(`${getTwitchHelixUrl('channels', params)}`, {
        headers: botHeader
    })

    let data = await response.json();

    if(data.error) return {
        error: true,
        message: data.message,
        status: data.status
    }

    data = data.data[0]

    if(saveToCache) {
        cacheClient.set(`channel:data:${channelID}`, JSON.stringify(data), 'EX', 60 * 60 * 3);
    }

    return {
        error: false,
        data: data
    }
    
}

module.exports = getChannelInformation;