const STREAMERS = require("../../class/streamer");
const { getClient } = require("../../util/database/dragonfly");
const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function getChannelEditors(channelID, cache = false) {
    let cacheClient = getClient();
    let streamer = await STREAMERS.getStreamerById(channelID);

    let streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams({
        broadcaster_id: channelID
    });

    let response = await fetch(getTwitchHelixUrl('channels/editors', params), {
        headers: streamerHeader
    })

    let data = await response.json();

    if(data.error) {
        return {
            error: true,
            message: data.message
        }
    }

    let editors = data.data;

    let editorList = [];

    let reset = cache ? false : true;

    for (let i = 0; i < editors.length; i++) {
        let editor = editors[i];

        let editorData = {
            id: editor.user_id,
            name: editor.user_name.toLowerCase(),
        }

        if(cache) {
            if(!reset) {
                cacheClient.del(`${channelID}:channel:editors`)
                reset = true
            }
            cacheClient.sadd(`${channelID}:channel:editors`, `${editor.user_name.toLowerCase()}`);
            cacheClient.expire(`${channelID}:channel:editors`, 60 * 60 * 24);
        }
        
        editorList.push(editorData);
    }

    return {
        error: false,
        editors: editorList
    }

}

module.exports = getChannelEditors