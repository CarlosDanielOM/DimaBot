const fs = require('fs');
const { getClient } = require('../util/database/dragonfly');

async function clearSpeachFiles(channelID) {
    const cacheClient = getClient();

    let messages = await cacheClient.scard(`${channelID}:speach`);

    if(messages === 0) return;

    let messageQueue = await cacheClient.smembers(`${channelID}:speach`);

    for(let i = 0; i < messageQueue.length; i++) {
        let id = messageQueue[i];
        fs.unlink(`${__dirname}/routes/public/speach/${id}.mp3`, async (err) => {
            if (err) {
                console.error(err);
                return;
            }

            await cacheClient.srem(`${channelID}:speach`, id);
        });
    }
    
}

module.exports = clearSpeachFiles;