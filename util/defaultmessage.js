const textConvertor = require('../handler/text');
const sendChatMessage = require('../function/chat/sendmessage');

async function defaultMessage (eventData, eventMessage, chatEnabled = true) {
    if(chatEnabled) {
        let message = await textConvertor(eventData.broadcaster_user_id, eventData, eventMessage);
        sendChatMessage(eventData.broadcaster_user_id, message);
    }
}

module.exports = defaultMessage;