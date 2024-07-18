const commandSchema = require('../schema/command');

async function disableCommand (channelID, argument) {
    let command = await commandSchema.findOne({channelID: channelID, cmd: argument});

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

    return {
        error: false,
        message: `Command ${argument} is now disabled`,
        status: 200,
        type: 'command_disabled'
    }

}

module.exports = disableCommand;