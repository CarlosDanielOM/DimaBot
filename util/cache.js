const { getClient } = require("./database/dragonfly");
const adminSchema = require('../schema/admin');

async function checkIfCacheExists() {
    let cacheClient = getClient();

    //? Check if the cache instance exists
    let cacheExists = await cacheClient.exists('cache:config');

    if(cacheExists) {
        return true;
    }

    //? Create the cache instance
    await cacheClient.set('cache:config', 1);

    return false;
    
}

module.exports = {
    checkIfCacheExists
}