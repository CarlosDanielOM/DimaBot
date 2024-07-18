const { getBotHeader } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function createClip(channelID) {
    let botHeader = await getBotHeader();

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);

    let response = await fetch(getTwitchHelixUrl('clip/create', params), {
        method: 'POST',
        headers: botHeader
    })

    if(response.status === 404) {
        return {
            error: true,
            message: 'Broadcaster must be live to create a clip',
            status: 404,
            type: 'Broadcaster not live'
        }
    }

    if(response.status !== 202) {
        response = await response.json();
        return {
            error: true,
            message: response.message,
            status: response.status,
            type: response.error
        }
    }

    response = await response.json();

    return {
        error: false,
        message: 'Clip created',
        status: 202,
        type: 'Clip created',
        clipID: response.data[0].id
    }
    
}

module.exports = createClip;