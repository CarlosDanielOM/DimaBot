const { getClient } = require("./database/dragonfly");

async function logger(data, cache = false, channelID = null, type = null) {
    let cacheClient = getClient();

    if(cache) {
        await cacheClient.set(`logger:${channelID}:${type}`, JSON.stringify({data, timestamp: Date.now().toLocaleString('en-US')}));
        await cacheClient.expire(`logger:${channelID}:${type}`, 60 * 60 * 24 * 7);
    }

    console.log({data, timestamp: Date.now().toLocaleString('en-US')})
    
}

module.exports = logger;