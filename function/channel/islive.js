const STREAMERS = require('../../class/streamer')
const { getTwitchHelixUrl } = require('../../util/link')
const { getBotHeader } = require('../../util/header')

async function isLive(channelID) {}

async function liveChannels() {
    const streamerIds = await STREAMERS.getStreamerIds()
    const botHeader = await getBotHeader()
    let params = new URLSearchParams({
        type: 'live'
    })

    if(streamerIds.length > 0 && streamerIds.length < 100) {
        for(let i = 0; i < streamerIds.length; i++) {
            params.append('user_id', streamerIds[i])
        }
    } else {
        return {
            error: true,
            message: 'Too many streamers to check',
            status: 400,
            type: 'too_many_streamers'
        }
    }

    let response = await fetch(getTwitchHelixUrl('streams', params), {
        headers: botHeader
    })

    let data = await response.json();

    if(data.error) {
        return {
            error: true,
            message: data.message
        }
    }
    
    let liveChannels = data.data;

    return {
        error: false,
        data: liveChannels
    }
    
}

module.exports = {
    isLive,
    liveChannels
}
