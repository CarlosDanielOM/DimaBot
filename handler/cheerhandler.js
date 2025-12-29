const { getClient } = require("../util/database/dragonfly");
const defaultMessage = require("../util/defaultmessage");
const STREAMER = require('../class/streamer');
const sendChatMessage = require('../function/chat/sendmessage');

async function cheerHandler(client, eventData, eventsubData, chatEnabled) {
    const cacheClient = getClient();
    let broadcasterID = eventData.broadcaster_user_id;
    
    if(eventData.is_anonymous) {
        sendChatMessage(broadcasterID, `Gracias por los ${eventData.bits} bits Anonimo!`);
        return;
    }

    let cheerMessage = eventsubData.message;

    if(cheerMessage == '') {
        return;
    }
    
    defaultMessage(eventData, cheerMessage, chatEnabled)
    
}

module.exports = cheerHandler;