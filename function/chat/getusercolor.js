const {getTwitchHelixURL} = require('../../util/link')
const {getBotHeader} =  require('../../util/header')

async function getUserColor(userID) {
    let response = await fetch(`${getTwitchHelixURL()}/chat/color?user_id=${userID}`, {
        headers: await getBotHeader()
    })

    let data = await response.json()

    if(data.error) {
        return {error: data.error, message: data.message, status: data.status}
    }

    data = data.data[0];

    return data.color;
}

module.exports = getUserColor