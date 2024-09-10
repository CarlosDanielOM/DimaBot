const { getClient } = require("./database/dragonfly");

async function logger(data, cache = false, channelID = null, type = null) {
    let cacheClient = getClient();

    if(cache) {
        let uniqueID = `${channelID}-${type}-${Date.now().toLocaleString('en-US')}`;
        await cacheClient.set(`logger:${channelID}:${type}:${uniqueID}`, JSON.stringify({data, timestamp: Date.now().toLocaleString('en-US')}));
        await cacheClient.expire(`logger:${channelID}:${type}:${uniqueID}`, 60 * 60 * 24 * 7);
    }

    console.log({data, timestamp: Date.now().toLocaleString('en-US')})
    
}

module.exports = logger;