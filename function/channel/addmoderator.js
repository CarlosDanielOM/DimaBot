const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function addModerator(channelID, userID) {
    let streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams();
    params.append("broadcaster_id", channelID);
    params.append("user_id", userID);

    let response = await fetch(getTwitchHelixUrl("moderation/moderators", params), {
        method: "POST",
        headers: streamerHeader,
    })

    if(response.status !== 204) {
        response = await response.json();
        return {
            status: response.status,
            message: response.message,
            type: response.error,
            error: true
        }
    }

    return {
        status: 200,
        message: "Success",
        error: false
    }
}

module.exports = addModerator