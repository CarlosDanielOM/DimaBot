const commandSchema = require('../schema/command');
const { getClient } = require('../util/database/dragonfly');

async function disableCommand (channelID, argument) {
    let command = await commandSchema.findOne({channelID: channelID, cmd: argument});
    let cacheClient = getClient();
    if (!command) {
        return {
            error: true,
            message: 'Command not found',
            status: 404,
            type: 'command_not_found'
        }
    }

    if (!command.enabled) {
        return {
            error: true,
            message: 'Command is already disabled',
            status: 400,
            type: 'command_disabled'
        }
    }

    command.enabled = false;

    await command.save();

    // Update cache to mark command as disabled
    let exists = await cacheClient.exists(`${channelID}:commands:${argument}`);
    
    if(exists) {
        await cacheClient.hset(`${channelID}:commands:${argument}`, 'enabled', 'false');
    }
    
    return {
        error: false,
        message: `Command ${argument} is now disabled`,
        status: 200,
        type: 'command_disabled'
    }
}

module.exports = disableCommand;