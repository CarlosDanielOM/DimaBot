const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function raid(channelID, streamerID) {
    let params = new URLSearchParams();
    params.append('from_broadcaster_id', channelID);
    params.append('to_broadcaster_id', streamerID);

    let streamerHeader = await getStreamerHeaderById(channelID);
    
    let response = await fetch(getTwitchHelixUrl('raids', params), {
        method: 'POST',
        headers: streamerHeader
    });

    let data = await response.json();

    return data;
    
}

module.exports = raid;