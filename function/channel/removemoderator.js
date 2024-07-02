const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function removeChannelModerator(channelID, userID) {
    let streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);
    params.append('user_id', userID);
    
    let response = await fetch(getTwitchHelixUrl('moderation/moderators', params), {
        method: 'DELETE',
        headers: streamerHeader
    });

    if(response.status !== 204) {
        response = await response.json();
        return {
            error: true,
            message: response.message,
            status: response.status,
            type: response.error
        }
    }

    return {
        error: false,
        message: 'Moderator removed',
        status: 200,
        type: 'success'
    }
    
}

module.exports = removeChannelModerator