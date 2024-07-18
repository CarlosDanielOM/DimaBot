const { getBotHeader } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function shoutout(channelID, streamerID, moderatorID) {
    let botHeader = await getBotHeader();

    let params = new URLSearchParams();
    params.append('from_broadcaster_id', channelID);
    params.append('to_broadcaster_id', streamerID);
    params.append('moderator_id', moderatorID);

    let response = await fetch(getTwitchHelixUrl('chat/shoutouts', params), {
        method: 'POST',
        headers: botHeader
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
        message: 'Shoutout sent'
    }
    
}

module.exports = shoutout;