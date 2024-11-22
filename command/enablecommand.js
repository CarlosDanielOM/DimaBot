const commandSchema = require('../schema/command');
const { getClient } = require('../util/database/dragonfly');

async function enableCommand (channelID, argument) {
    const cacheClient = getClient();
    let command = await commandSchema.findOne({channelID: channelID, cmd: argument});

    if (!command) {
        return {
            error: true,
            message: 'Command not found',
            status: 404,
            type: 'command_not_found'
        }
    }

    if (command.enabled) {
        return {
            error: true,
            message: 'Command is already enabled',
            status: 400,
            type: 'command_enabled'
        }
    }

    command.enabled = true;

    let exists = await cacheClient.exists(`${channelID}:commands:${argument}`);
    
    if(exists) {
        await cacheClient.hset(`${channelID}:commands:${argument}`, 'enabled', 1);
    }

    await command.save();

    return {
        error: false,
        message: `Command ${argument} is now enabled`,
        status: 200,
        type: 'command_enabled'
    }

}

module.exports = enableCommand;