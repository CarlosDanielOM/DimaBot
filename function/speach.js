const { getUrl } = require("../util/dev");

async function speach(messageID, message, channelID) {
    let response = await fetch(`${getUrl()}/speech/${channelID}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            speach: message,
            msgID: messageID
        })
    })
    if(response.status !== 200) {
        return {
            error: true,
            message: 'Error al enviar mensaje',
            status: response.status,
            type: 'error'
        }
    }
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