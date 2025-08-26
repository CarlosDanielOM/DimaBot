const { getClient } = require("../util/database/dragonfly");
const defaultMessage = require("../util/defaultmessage");
const STREAMER = require('../class/streamer');

async function cheerHandler(client, eventData, eventsubData, chatEnabled) {
    const cacheClient = getClient();
    let broacasterLogin = eventData.broadcaster_user_login;
    
    if(eventData.is_anonymous) {
        return client.say(broacasterLogin, `Gracias por los ${eventData.bits} bits Anonimo!`);
    }

    let cheerMessage = eventsubData.message;

    if(cheerMessage == '') {
        return;
    }
    
    defaultMessage(client, eventData, cheerMessage, chatEnabled)
    
}

module.exports = cheerHandler;