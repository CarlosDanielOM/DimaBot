const { getStreamerById } = require("../../class/streamer");
const { getClient } = require("../../util/database/dragonfly");
const { getTwitchHelixUrl } = require("../../util/link");

async function getChannelModerators(channelID, userIDs = [], cache = false) {
    let cacheClient = getClient();

    let streamerHeader = await getStreamerById(channelID);

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);

    if(userIDs.length > 0) {
        for (let i = 0; i < userIDs.length; i++) {
            params.append('user_id', userIDs[i]);
        }
    }
    
    let response = await fetch(getTwitchHelixUrl('moderation/moderators', params), {
        headers: streamerHeader
    });

    let data = await response.json();

    if(data.error) {
        return {
            error: true,
            message: data.message,
            status: data.status
        }
    }

    data = data.data;

    let ids = [];
    let logins = [];
    let displayNames = [];

    if(data.length === 0) {
        return {
            error: false,
            data: [],
            ids: [],
            logins: [],
            displayNames: []
        }
    } 

    for (let i = 0; i < data.length; i++) {
        ids.push(data[i].user_id);
        logins.push(data[i].user_login);
        displayNames.push(data[i].user_name);
    }

    return {
        error: false,
        data,
        ids,
        logins,
        displayNames
    }
    
}

module.exports = getChannelModerators;