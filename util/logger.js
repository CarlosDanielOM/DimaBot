const { getClient } = require("./database/dragonfly");

async function logger(data, cache = false, channelID = null, type = null) {
    let cacheClient = getClient();

    if(cache) {
        await cacheClient.set(`logger:${channelID}:${type}`, JSON.stringify({data, timestamp: Date.now()}));
    }

    console.log({data, timestamp: Date.now()})
    
}

module.exports = logger;