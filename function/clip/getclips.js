const { getBotHeader } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function getChannelClips(channelID, amount = null) {
    let botHeader = await getBotHeader();

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);
    if(amount) {
        params.append('first', amount);
    }

    let response = await fetch(getTwitchHelixUrl('clips', params), {
        headers: botHeader
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
        data: data.data
    }
}

module.exports = getChannelClips;