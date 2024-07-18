const { getBotHeader } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function ban(channelID, userID, moderatorID, duration = null, reason = null) {
    let botHeader = await getBotHeader();

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);
    params.append('moderator_id', moderatorID);

    let bodyData = {
        user_id: userID,
    }

    if(duration) {
        bodyData.duration = duration;
    }

    if(reason) {
        bodyData.reason = reason;
    }

    let response = await fetch(getTwitchHelixUrl('moderation/bans', params), {
        method: 'POST',
        headers: botHeader,
        body: JSON.stringify(bodyData)       
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
        data: data.data[0]
    }
    
}