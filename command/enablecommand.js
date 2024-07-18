const commandSchema = require('../schema/command');

async function enableCommand (channelID, argument) {
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

    await command.save();

    return {
        error: false,
        message: `Command ${argument} is now enabled`,
        status: 200,
        type: 'command_enabled'
    }

}

module.exports = enableCommand;