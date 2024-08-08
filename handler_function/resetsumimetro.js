const { getClient } = require("../util/database/dragonfly");

async function resetSumimetro(channelID) {
    const cacheClient = getClient();

    let keys = await cacheClient.keys(`${channelID}:sumimetro:*`);
    
    if(keys.length == 0) return;

    for(let i = 0; i < keys.length; i++) {
        try {
            await cacheClient.del(keys[i]);
        }
        catch(e) {
            console.log(`Error deleting key: ${keys[i]}`);
        }
    }

    return;
    
}

module.exports = resetSumimetro;