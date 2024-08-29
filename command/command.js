const COMMAND = require('../class/command')
const STREAMERS = require('../class/streamer')
const commandTimerSchema = require('../schema/commandtimer');
const { getClient } = require('../util/database/dragonfly');

const commandPermissionsLevels = {
    1: 'everyone',
    2: 'tier1',
    3: 'tier2',
    4: 'tier3',
    5: 'vip',
    6: 'founder',
    7: 'mod',
    8: 'editor',
    9: 'admin',
    10: 'broadcaster'
}

const commandPermissions = {
    everyone: 1,
    tier1: 2,
    tier2: 3,
    tier3: 4,
    vip: 5,
    founder: 6,
    mod: 7,
    editor: 8,
    admin: 9,
    broadcaster: 10
}

const cmdOptionsExistsRegex = new RegExp(/^\-([a-z]+\=[a-zA-Z0-9]+)(?:\W)?(.*)?$/); //? This is used to check if options exist in a string
const firstCmdOptionsRegex = new RegExp(/([a-z]+\=[a-zA-Z0-9]+)(?:\W)?(.*)?$/) //? This is used to get the first option from a string of options
const cmdOptionValueRegex = new RegExp(/([a-z]+)\=([a-zA-Z0-9]+)?$/); //? This is used to get the key and value from an option
const specialCommandsFunc = (/\$\((.*?)\)/g); //? This is used to get the special commands from a string

const maxFuncLength = 350;

let cmdOptions = {
    name: null,
    cmd: null,
    type: null,
    cooldown: 10,
    channel: null,
    channelID: null,
    userLevel: 1,
    userLevelName: 'everyone',
    func: null,
    message: null
}

async function createCommand(channelID, argument, type = null) {
    let streamer = await STREAMERS.getStreamerById(channelID);

    cmdOptions.channel = streamer.name;
    cmdOptions.channelID = channelID;
    
    let { options, text } = getCmdOptions(argument);

    options.forEach(option => {
        switch(option.name) {
            case 'cd':
                if(Number(option.value) > 5) {
                    cmdOptions.cooldown = Number(option.value);
                } else {
                    cmdOptions.cooldown = 15;
                }
                break;
            case 'ul':
                if(option.value.length > 1) {
                    let level = commandPermissions[option.value];
                    if(level) {
                        cmdOptions.userLevel = Number(level);
                        cmdOptions.userLevelName = option.value;
                    } else {
                        return {
                            error: true,
                            message: `User level ${option.value} is invalid`,
                        }
                    }
                } else {
                    let level = commandPermissionsLevels[Number(option.value)];
                    if(level) {
                        cmdOptions.userLevel = Number(option.value);
                        cmdOptions.userLevelName = level;
                    } else {
                        return {
                            error: true,
                            message: `User level ${option.value} is invalid`,
                        }
                    }
                }
                break;
            default: 
                break;
        }
    })

    let opts = text.split(' ');
    let commandName = opts.shift();

    let func = opts.join(' ');

    if(!func) {
        return {
            error: true,
            message: 'Command function is empty'
        }
    }
    if(func.length > maxFuncLength) {
        return {
            error: true,
            message: 'Command function is too long'
        }
    }
    
    cmdOptions.name = commandName;
    cmdOptions.cmd = commandName;
    cmdOptions.func = commandName;
    cmdOptions.message = func;
    cmdOptions.type = type ? type : 'command';

    if(specialCOmmands(cmdOptions.message)) {
        cmdOptions.type = 'countable';
    }

    let command = await COMMAND.createCommand(channelID, cmdOptions);

    if(command.error) {
        return {
            error: true,
            message: command.message
        }
    }

    return {
        error: false,
        message: `Command ${command.command.name} created`,
        command: command.command
    }
    
}

async function deleteCommand(channelID, commandCMD) {
    let exists = await COMMAND.getCommandFromDB(channelID, commandCMD);
    const cacheClient = getClient();
    if(exists.error) {
        return {
            error: true,
            message: exists.message
        }
    }
    let command = exists.command;

    if(command.reserved) {
        return {
            error: true,
            message: 'You cannot delete a reserved command'
        }
    }

    let timers = await commandTimerSchema.find({channelID, command: command.cmd});

    if(timers.length > 0) {
        return {
            error: true,
            message: 'You cannot delete a command with active timers'
        }
    }
    
    let deleted = await COMMAND.deleteCommand(channelID, commandCMD);
    await cacheClient.del(`${channelID}:commands:${commandCMD}`);

    if(deleted.error) {
        return {
            error: true,
            message: deleted.message
        }
    }

    return {
        error: false,
        message: `Command ${command.cmd} deleted`
    }
    
}

async function editCommand(channelID, argument) {
    let cacheClient = getClient();
    let {options, text} = getCmdOptions(argument);

    let opts = text.split(' ');
    let commandName = opts.shift();

    let oldCommand = await COMMAND.getCommandFromDB(channelID, commandName);
    if(oldCommand.error) {
        oldCommand = await COMMAND.getReservedCommandFromDB(channelID, commandName);
        if(oldCommand.error) {
            return {
                error: true,
                message: oldCommand.message
            }
        }
    }
    
    oldCommand = oldCommand.command;

    options.forEach(option => {
        switch(option.name) {
            case 'cd':
                if(Number(option.value) > 5) {
                    oldCommand.cooldown = Number(option.value);
                } else {
                    oldCommand.cooldown = 15;
                }
                cacheClient.hset(`${channelID}:commands:${commandName}`, 'cooldown', oldCommand.cooldown);
                break;
            case 'ul':
                if(option.value.length > 1) {
                    let level = commandPermissions[option.value];
                    if(level) {
                        oldCommand.userLevel = Number(level);
                        oldCommand.userLevelName = option.value;
                    } else {
                        return {
                            error: true,
                            message: `User level ${option.value} is invalid`,
                        }
                    }
                } else {
                    let level = commandPermissionsLevels[Number(option.value)];
                    if(level) {
                        oldCommand.userLevel = Number(option.value);
                        oldCommand.userLevelName = level;
                    } else {
                        return {
                            error: true,
                            message: `User level ${option.value} is invalid`,
                        }
                    }
                }
                cacheClient.hset(`${channelID}:commands:${commandName}`, 'level', oldCommand.userLevel);
                break;
            default: 
                break;
        }
    })

    let func = opts.join(' ');

    if(func.length > maxFuncLength) {
        return {
            error: true,
            message: 'Command function is too long'
        }
    }

    if(!oldCommand.reserved) {
        if(specialCOmmands(func)) {
            oldCommand.type = 'countable';
        } 
        if(func !== null || func != '' || func != undefined || func.length > 0) {
            oldCommand.message = func;
        } else {
            oldCommand.message = oldCommand.message;
        }
    }

    let updated = await COMMAND.updateCommandInDB(channelID, commandName, oldCommand)

    if(updated.error) {
        return {
            error: true,
            message: updated.message
        }
    }

    return {
        error: false,
        message: `Command ${commandName} updated`
    }
    
}

module.exports = {
    createCommand,
    deleteCommand,
    editCommand
}

function getCmdOptions(text) {
    let options = [];

    let stop = false;

    let [firstRaw, firstOption, resText] = text.match(firstCmdOptionsRegex) || [];

    if(!firstRaw) {
        return { options, text };
    }

    text = resText;

    let [firstRawOption, firstOptionName, firstOptionValue] = firstOption.match(cmdOptionValueRegex) || [];

    options.push({ name: firstOptionName, value: firstOptionValue });

    while(!stop) {
        let [raw, option, resText] = text.match(cmdOptionsExistsRegex) || [];

        if(!raw) {
            stop = true;
            continue;
        }

        text = resText;

        let [rawOption, optionName, optionValue] = option.match(cmdOptionValueRegex) || [];

        options.push({ name: optionName, value: optionValue });
    }

    return { options, text };
    
}

function specialCOmmands(cmdFunc) {
    let countable = false;
    let specials = cmdFunc.match(specialCommandsFunc) || [];
    specials.forEach(special => {
        let cmdSpecial = specialCommandsFunc.exec(cmdFunc);
        switch(cmdSpecial[1]) {
            case 'count':
                countable = true;
                break;
            case 'scount':
                countable = true;
                break;
            default:
                break;
        }
    })

    return countable;
}