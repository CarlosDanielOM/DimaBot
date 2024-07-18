const { getUrl } = require("../util/dev");

async function speach(messageID, message, channelID) {
    let response = await fetch(`${getUrl()}/speach/${channelID}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messageID,
            message
        })
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

module.exports = speach;