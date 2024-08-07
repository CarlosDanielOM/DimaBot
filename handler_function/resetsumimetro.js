const { getClient } = require("../util/database/dragonfly");

async function resetSumimetro(channelID) {
    const cacheClient = getClient();

    let keys = await cacheClient.keys(`${channelID}:sumimetro:*`);
    
    if(keys.length == 0) return;

    for(let key of keys) {
        try {
            await cacheClient.del(key);
        }
        catch(e) {
            console.log(`Error deleting key: ${key}`);
        }
    }

    return;
    
}

module.exports = resetSumimetro;