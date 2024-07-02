const STREAMERS = require('../../class/streamer')
const {getStreamerHeaderById} = require('../../util/header');
const {getTwitchHelixURL} = require('../../util/link');

async function deleteMessage(messageID, channel, modID) {
    let streamer = await STREAMERS.getStreamerByName(channel);
    if(!streamer) return {error: true, message: 'Streamer doesn\'t exist'}

    let streamerHeader = await getStreamerHeaderById(streamer.user_id);
    if(!streamerHeader) return {error: true, message: 'Error getting streamer header'}

    let response = await fetch(`${getTwitchHelixURL()}/moderation/chat?broadcaster_id=${streamer.user_id}&message_id=${messageID}&moderator_id=${modID}`, {
        method: 'DELETE',
        headers: streamerHeader
    })
    
    if(response.status === 204) return {error: false, message: 'Message deleted'}
    
    response = await response.json();

    if(response.error) return {error: true, message: response.error}

    return {error: false, message: 'Message deleted'}
    
}

module.exports = deleteMessage;