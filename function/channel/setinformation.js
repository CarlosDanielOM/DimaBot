const STREAMERS = require('../../class/streamer');
const { getStreamerHeaderById } = require('../../util/header');
const { getTwitchHelixUrl } = require('../../util/link');

async function setChannelInformation(channelID, newInformation) {
    let streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);
    
    let response = await fetch(getTwitchHelixUrl('channels', params), {
        method: 'PATCH',
        headers: streamerHeader,
        body: JSON.stringify(newInformation)
    })

    if (response.status !== 204) {
        response = await response.json();
        return {
            error: true,
            message: 'Failed to modified channel information',
            status: response.status,
            type: response.error
        }
    } else {
        return {
            error: false,
            message: 'Channel information modified',
            status: 200,
        }
    }
}

module.exports = setChannelInformation