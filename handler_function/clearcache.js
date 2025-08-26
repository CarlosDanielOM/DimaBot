const { getClient } = require("../util/database/dragonfly");

async function resetCacheAtOffline(channelID) {
    const cacheClient = getClient();

    await cacheClient.del(`${channelID}:follows:count`);
    await cacheClient.del(`${channelID}:commands`);
    
}

module.exports = resetCacheAtOffline;