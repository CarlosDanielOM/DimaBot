const {getTwitchHelixURL} = require('../../util/link');
const {getStreamerHeaderById} = require('../../util/header')

async function setOnlyEmotes(channelID, emotes = true, modID = 698614112) {
    let streamerHeader = await getStreamerHeaderById(channelID);

    let response = await fetch(`${getTwitchHelixURL()}/chat/settings?broadcaster_id=${channelID}&moderator_id=${modID}`, {
        method: 'PATCH',
        headers: streamerHeader,
        body: JSON.stringify({
            emote_mode: emotes
        })
    });

    let data = await response.json();

    if(data.error) return {error: true, type: data.error, message: data.message, status: data.status}

    data = data.data[0];

    return {
        error: false,
        message: 'Success',
        status: 200,
        data
    }

}

module.exports = setOnlyEmotes;