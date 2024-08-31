const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function unraid(channelID) {
    const streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);

    let response = await fetch(getTwitchHelixUrl('raids', params), {
        method: 'DELETE',
        headers: streamerHeader
    });

    if(response.status == 204) {
        return {error: false, message: 'Successfully unraided the channel!'};
    }

    let data = await response.json();

    return {error: true, message: data.message};
    
}

module.exports = unraid;