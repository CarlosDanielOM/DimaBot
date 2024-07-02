const STREAMERS = require('../../class/streamer')
const { getStreamerHeaderById } = require('../../util/header')
const { getTwitchHelixUrl } = require('../../util/link')

async function getChannelInformation(channelID) {
    let streamer = await STREAMERS.getStreamerById(channelID)

    let streamerHeader = await getStreamerHeaderById(channelID)

    let params = new URLSearchParams({
        broadcaster_id: channelID
    })

    let response = await fetch(`${getTwitchHelixUrl('channels', params)}`, {
        headers: streamerHeader
    })

    let data = await response.json();

    if(data.error) return {
        error: true,
        message: data.message,
        status: data.status
    }

    data = data.data[0]

    return {
        error: false,
        data: data
    }
    
}

module.exports = getChannelInformation;