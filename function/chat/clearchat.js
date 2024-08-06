const {getStreamerHeaderById} = require('../../util/header');
const {getTwitchHelixURL} = require('../../util/link');
const STREAMERS = require('../../class/streamer');

async function clearChat(channelID, modID) {
    let streamerHeader = await getStreamerHeaderById(channelID);

    if(!streamerHeader) return {error: false, message: 'Streamer header not found.', status: 404}

    let response = await fetch(`${getTwitchHelixURL()}/moderation/chat?broadcaster_id=${channelID}&moderator_id=${modID}`, {
        method: 'DELETE',
        headers: streamerHeader
    })

    if(response.status == 204) {
        return {error: false, message: 'Chat cleared.', status: 200}
    }
    
    let data = await response.json();

    if(data.error) {
        return {error: true, message: data.message, status: 400}
    }

    return {error: false, message: 'Chat cleared.', status: 200}
  
}

module.exports = clearChat