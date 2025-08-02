const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function getTwitchFollowers(channelID, userId = null) {
    let streamerHeader = await getStreamerHeaderById(channelID);
    
    let params = new URLSearchParams({
        broadcaster_id: channelID
    })

    let response = await fetch(getTwitchHelixUrl('channels/followers', params), {
        method: 'GET',
        headers: streamerHeader
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

    let followers = data.data ?? [];
    let total = data.total ?? 0;

    return {
        error: false,
        message: 'Successfully fetched followers',
        data: followers,
        total
    }
}

module.exports = getTwitchFollowers;