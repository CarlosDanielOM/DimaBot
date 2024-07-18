//? MAKE CONCURRENCY IF NEEDED TO-DO

const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function getChannelChatters(channelID, moderatorID) {
    let streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);
    params.append('moderator_id', moderatorID);

    let response = await fetch(getTwitchHelixUrl('chat/chatters', params), {
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

    return {
        error: false,
        chatters: data.data
    }
    
}

module.exports = getChannelChatters;