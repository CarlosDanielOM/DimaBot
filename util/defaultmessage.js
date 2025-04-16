const textConvertor = require('../handler/text');

async function defaultMessage (client, eventData, eventMessage, chatEnabled = true) {
    if(chatEnabled) {
        let message = await textConvertor(eventData.broadcaster_user_id, eventData, eventMessage);
        client.say(eventData.broadcaster_user_login, message);
    }
}

module.exports = defaultMessage;