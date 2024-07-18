const STREAMER = require('../class/streamer')
const commandTimerSchema = require('../schema/commandtimer')
const commandSchema = require('../schema/command')

async function createTimerCommand (channelID, argument) {
    const streamer = await STREAMER.getStreamerById(channelID);

    const [commandName, time] = argument.split(' ');

    if (!commandName || !time) {
        return {
            error: true,
            message: 'Please provide a command name and time',
            status: 400,
            type: 'missing_arguments'
        }
    }

    if (isNaN(time)) {
        return {
            error: true,
            message: 'Time should be a number',
            status: 400,
            type: 'invalid_time'
        }
    }

    if (time < 1) {
        return {
            error: true,
            message: 'Time should be greater than 0',
            status: 400,
            type: 'invalid_time'
        }
    }

    if(time > 60) {
        return {
            error: true,
            message: 'Time should be less than 60',
            status: 400,
            type: 'invalid_time'
        }
    }

    let command = await commandSchema.findOne({channelID: channelID, cmd: commandName});

    if (!command) {
        return {
            error: true,
            message: 'Command not found',
            status: 404,
            type: 'command_not_found'
        }
    }

    let timer = await commandTimerSchema.findOne({channelID: channelID, command: commandName});

    if (timer) {
        return {
            error: true,
            message: 'Timer already exists',
            status: 400,
            type: 'timer_already_exists'
        }
    }

    timer = new commandTimerSchema({
        channelID: channelID,
        channel: streamer.name,
        command: commandName,
        time: time
    });

    await timer.save();

    return {
        error: false,
        message: `Timer created for command ${commandName} for every ${time} minutes`,
        status: 200,
        type: 'timer_created'
    }
    
}

async function deleteTimerCommand (channelID, argument) {
    const streamer = await STREAMER.getStreamerById(channelID);

    if(!argument) {
        return {
            error: true,
            message: 'Please provide a command name',
            status: 400,
            type: 'missing_arguments'
        }
    }

    let timer = await commandTimerSchema.findOne({channelID: channelID, command: argument});

    if (!timer) {
        return {
            error: true,
            message: 'Timer not found',
            status: 404,
            type: 'timer_not_found'
        }
    }

    await timer.delete();

    return {
        error: false,
        message: `Timer deleted for command ${argument}`,
        status: 200,
        type: 'timer_deleted'
    }
}

async function editTimerCommand (channelID, argument) {
    const streamer = await STREAMER.getStreamerById(channelID);

    const [commandName, time] = argument.split(' ');

    if (!commandName || !time) {
        return {
            error: true,
            message: 'Please provide a command name and time',
            status: 400,
            type: 'missing_arguments'
        }
    }

    if (isNaN(time)) {
        return {
            error: true,
            message: 'Time should be a number',
            status: 400,
            type: 'invalid_time'
        }
    }

    if (time < 1) {
        return {
            error: true,
            message: 'Time should be greater than 0',
            status: 400,
            type: 'invalid_time'
        }
    }

    if(time > 60) {
        return {
            error: true,
            message: 'Time should be less than 60',
            status: 400,
            type: 'invalid_time'
        }
    }

    let timer = await commandTimerSchema.findOne({channelID: channelID, command: commandName});

    if (!timer) {
        return {
            error: true,
            message: 'Timer not found',
            status: 404,
            type: 'timer_not_found'
        }
    }

    timer.timer = time;

    await timer.save();

    return {
        error: false,
        message: `Timer updated for command ${commandName} for every ${time} minutes`,
        status: 200,
        type: 'timer_updated'
    }
}

module.exports = {
    createTimerCommand,
    deleteTimerCommand,
    editTimerCommand
}