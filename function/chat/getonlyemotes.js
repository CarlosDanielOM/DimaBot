const {getTwitchHelixURL} = require('../../util/link')
const {getStreamerHeaderById} = require('../../util/header')

async function getOnlyEmotes(channelID, modID = 698614112) {
    let params = `?broadcaster_id=${channelID}`;
    let streamerHeader = await getStreamerHeaderById(channelID);

    if(modID) {
        params += `&moderator_id=${modID}`;
    }

    let response = await fetch(`${getTwitchHelixURL()}/chat/settings${params}`, {
        headers: streamerHeader
    })

    let data = await response.json();
    data = data.data[0];

    return {
        error: false,
        message: 'Success',
        status: 200,
        data: data.emote_mode
    }    
    
}

module.exports = getOnlyEmotes