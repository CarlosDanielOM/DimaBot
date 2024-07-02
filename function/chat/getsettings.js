const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixURL } = require("../../util/link");

async function getChatSettings(channelID, modId = 698614112) {
    let streamerHeader = await getStreamerHeaderById(channelID);

    let response = await fetch(`${getTwitchHelixURL()}/chat/settings?broadcaster_id=${channelID}&moderator_id=${modId}`, {
        headers: streamerHeader
    })

    let data = await response.json();

    if(data.error) return {error: true, data: data, status: 400, message: "Error getting chat settings"}
    
    data = data.data[0];

    return {error: false, data: data, status: 200, message: "success"}
    
}

module.exports = getChatSettings