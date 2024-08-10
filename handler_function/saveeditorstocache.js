const { getEditors } = require("../function/channel");
const { getClient } = require("../util/database/dragonfly");

async function saveEditorToCache(channelID) {
    let cacheClient = getClient();

    let editors = await getEditors(channelID);

    if(editors.error) {
        return {
            error: true,
            message: editors.message
        }
    }

    try{
        await cacheClient.sadd(`${channelID}:channel:editors`, editors.editors);
    } catch (error) {
        console.log({error: 'Error saving editors to cache', message: error});
        return {
            error: true,
            message: error
        }
    }
    
    return {
        error: false
    }
}

module.exports = saveEditorToCache;