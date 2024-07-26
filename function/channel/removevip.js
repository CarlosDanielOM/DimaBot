const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function removeChannelVIP(channelID, userID) {
    let streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams({
        "user_id": userID,
        "broadcaster_id": channelID
    })

    let response = await fetch(getTwitchHelixUrl("channels/vips", params), {
        method: "DELETE",
        headers: streamerHeader
    })

    if(response.status !== 204) {
        response = await response.json();
        return {
            error: true,
            message: response.message,
            status: response.status,
            type: response.error
        }
    }

    return {
        error: false,
        message: "Success",
        status: 200,
    }
    
}

module.exports = removeChannelVIP