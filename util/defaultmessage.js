const textConvertor = require('../handler/text');

async function defaultMessage (client, eventData, eventMessage) {
    let message = await textConvertor(eventData.broadcaster_user_id, eventData, eventMessage);
    client.say(eventData.broadcaster_user_login, message.message);
}

module.exports = defaultMessage;