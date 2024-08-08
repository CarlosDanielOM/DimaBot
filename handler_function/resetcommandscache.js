const { getClient } = require("../util/database/dragonfly");

async function resetCommandsFromCache(client, channelID) {
    let cacheClient = getClient();

    let keys = await cacheClient.keys(`${channelID}:commands:*`);

    if(keys.length === 0) return;

    for(let i = 0; i < keys.length; i++) {
        await cacheClient.del(keys[i]);
    }

    return;
    
}

module.exports = resetCommandsFromCache;