const { getStreamerHeaderById } = require('../../util/header')
const { getTwitchHelixUrl } = require('../../util/link')

async function announcement(channelID, moderatorID, message, color = 'purple') {
    let streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams({
        broadcaster_id: channelID,
        moderator_id: moderatorID,
    });
    
    let bodyData = {
        message: message,
        color: color
    }

    let response = await fetch(getTwitchHelixUrl('chat/announcements', params), {
        method: 'POST',
        headers: streamerHeader,
        body: JSON.stringify(bodyData)
    })

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
        message: 'Announcement sent'
    }
    
}

module.exports = announcement;