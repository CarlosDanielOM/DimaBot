const {getStreamerHeaderById} = require('../../util/header');
const {getTwitchHelixURL} = require('../../util/link');
const STREAMERS = require('../../class/streamer');

async function clearChat(channel, modID) {
    let streamer = STREAMERS.getStreamerByName(channel)

    if(!streamer) return {error: false, message: 'Streamer not found.', status: 404}

    let streamerHeader = await getStreamerHeaderById(streamer.user_id);

    if(!streamerHeader) return {error: false, message: 'Streamer header not found.', status: 404}

    let response = await fetch(`${getTwitchHelixURL()}/moderation/chat?broadcaster_id=${streamer.user_id}&moderator_id=${modID}`, {
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