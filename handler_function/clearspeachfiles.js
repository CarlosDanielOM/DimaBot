const fs = require('fs');
const { getClient } = require('../util/database/dragonfly');

async function clearSpeachFiles(channelID) {
    const cacheClient = getClient();

    let messages = await cacheClient.scard(`${channelID}:speach`);

    if(messages === 0) return;

    let messageQueue = await cacheClient.smembers(`${channelID}:speach`);

    for(let i = 0; i < messageQueue.length; i++) {
        let id = messageQueue[i];
        const filePath = `${__dirname}/routes/public/speach/${id}.mp3`;
        
        // Check if file exists before attempting to delete
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, async (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                
                await cacheClient.srem(`${channelID}:speach`, id);
            });
        } else {
            // If file doesn't exist, just remove from the cache
            await cacheClient.srem(`${channelID}:speach`, id);
        }
    }
    
}

module.exports = clearSpeachFiles;