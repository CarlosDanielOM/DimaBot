const { getClient } = require("../util/database/dragonfly");

async function cheerHandler(client, eventData, eventsubData) {
    const cacheClient = getClient();
    let broacasterLogin = eventData.broadcaster_user_login;
    
    if(eventData.is_anonymous) {
        return;
    }

    client.say(broacasterLogin, `Gracias por los ${eventData.bits} bits ${eventData.user_name}!`);
    
}

module.exports = cheerHandler;