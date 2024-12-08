const {getClient} = require('../util/database/dragonfly');

const commandSchema = require('../schema/command');
const logger = require('../util/logger');

async function addCommandsToCache(channelID) {
    const cacheClient = getClient();

    let commands = await commandSchema.find({channelID});

    if (!commands) {
        return logger({error: true, message: "Error getting the commands at channel startup"}, true, channelID, `Command-fetching-at-start-time-${channelID}`);
    }

    for(let i = 0; i < commands.length; i++) {
        let cacheCommandData = {
            func: commands[i].func,
            level: commands[i].userLevel,
            cooldown: commands[i].cooldown,
            enabled: commands[i].enabled,
        }

        try {
            await cacheClient.hset(`${channelID}:commands:${commands[i].cmd}`, cacheCommandData);
        } catch (e) {
            logger({error: true, message: "Error saving command to cache"}, true, channelID, `Command-saving-to-cache-${channelID}-${commands[i].cmd}`);
        }
    }

    await cacheClient.set(`${channelID}:commands`, 1);
}

module.exports = addCommandsToCache;