const { getBotHeader } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function getClip(channelID, clipID) {
    let botHeader = await getBotHeader();

    if(!clipID) {
        return {
            error: true,
            message: 'Clip ID is required',
            status: 400,
            type: 'Clip ID required'
        }
    }

    let params = new URLSearchParams();
    // params.append('broadcaster_id', channelID);
    params.append('id', clipID);

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

    if(data.data.length === 0) {
        return {
            error: true,
            message: 'Clip not found',
            status: 404,
            type: 'Clip not found'
        }
    }

    return {
        error: false,
        data: data.data[0]
    }
    
}

module.exports = getClip;