const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function getChannelSubscriptions(channelID) {
    let streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams({
        "broadcaster_id": channelID
    });

    let response = await fetch(getTwitchHelixUrl("subscriptions", params), {
        headers: streamerHeader
    });

    let data = await response.json();

    if(data.error) return {
        error: true,
        message: data.message,
        status: data.status,
        type: data.error
    }
    
    return {
        error: false,
        data: data.data,
        total: data.total,
        poins: data.points
    }
    
}

module.exports = getChannelSubscriptions;