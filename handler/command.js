const COMMAND = require('../class/command')
const STREAMERS = require('../class/streamer')
const CHANNEL = require('../function/channel')
const CHAT = require('../function/chat')
const COMMANDS = require('../command');

const categories = require('../function/search/categories');
const { getUserByLogin } = require('../function/user/getuser');

let specialCommandsFunc = (/\$\(([a-z]+)\s?([a-z0-9]+)?\s?([a-zA-Z0-9?;\/\s]+)?\)/g);

async function commandHandler(channelID, tags, command, argument) {
    let cmd = await COMMAND.getCommandFromDB(channelID, command);
    if(cmd.error) {
        return {
            error: true,
            message: cmd.message,
            status: cmd.status,
            type: cmd.type
        }
    };
    let commandData = cmd.command;
    if(!commandData.enabled) {
        return {
            error: true,
            message: 'Command is disabled',
            status: 400,
            type: 'command_disabled'
        }
    };

    let specialRes = await specialCommands(channelID, tags, argument, commandData.message, commandData.count);
    if(commandData.type == 'countable') {
        await COMMAND.updateCountableCommandInDB(channelID, command, specialRes.count);
    }
    commandData.message = specialRes.cmdFunc;

    return {
        error: false,
        message: commandData.message,
        status: 200,
        type: 'success',
        command: commandData
    }
    
}

module.exports = commandHandler;

async function specialCommands(channelID, tags, argument, cmdFunc, count = 0) {
    const streamer = await STREAMERS.getStreamerById(channelID);
    let specials = cmdFunc.match(specialCommandsFunc) || [];
    let message;
    for(let i = 0; i < specials.length; i++) {
        specialCommandsFunc.lastIndex = 0;
        let special = specialCommandsFunc.exec(cmdFunc);
        switch(special[1]) {
            case 'user':
                cmdFunc = cmdFunc.replace(special[0], tags['display-name']);
                break;
            case 'touser':
                if(argument) {
                    cmdFunc = cmdFunc.replace(special[0], argument);
                } else {
                    cmdFunc = cmdFunc.replace(special[0], tags['display-name']);
                }
                break;
            case 'random':
                let maxNumber = special[2] || 100;
                let random = Math.floor(Math.random() * maxNumber);
                cmdFunc = cmdFunc.replace(special[0], random);
                break;
            case 'randomuser':
                let chatters = await CHAT.getChatters(channelID, channelID);
                if(chatters.error) {
                    cmdFunc = cmdFunc.replace(special[0], chatters.message);
                    break;
                }
                let randomUser = chatters.chatters[Math.floor(Math.random() * chatters.chatters.length)].user_name;
                cmdFunc = cmdFunc.replace(special[0], randomUser);
                break;
            case 'count':
                if(!argument) argument = 0;
                if(argument != 0) argument = argument.replace(/\+/g, '');
                if(!count) count = 0;
                let newCount = count + parseInt(argument);
                cmdFunc = cmdFunc.replace(special[0], newCount);
                count = newCount;
                break;
            case 'scount':
                count++;
                cmdFunc = cmdFunc.replace(special[0], count);
                break;
            case 'twitch':
                if(!special[2]) break;
                switch(special[2]) {
                    case 'subs':
                        let totalSubs = await CHANNEL.getSubscriptions(channelID);
                        cmdFunc = cmdFunc.replace(special[0], totalSubs.total);
                        break;
                    case 'title':
                        let title = await CHANNEL.getInformation(channelID);
                        cmdFunc = cmdFunc.replace(special[0], title.data.title);
                        break;
                    case 'game':
                        let game = await CHANNEL.getInformation(channelID);
                        let gameName = game.data.game_name;
                        cmdFunc = cmdFunc.replace(special[0], gameName);
                        break;
                    case 'channel':
                        cmdFunc = cmdFunc.replace(special[0], streamer.name);
                        break;
                }
                break;
            case 'set':
                if(!special[2]) break;
                switch(special[2]) {
                    case 'game':
                        let game = special[3] || argument;
                        let category = await categories(game);
                        if(category.error) {
                            console.log(category.message);
                            break;
                        }
                        let gameData = {
                            game_name: category.data[0].name,
                            game_id: category.data[0].id
                        }
                        let updateGame = await CHANNEL.setInformation(channelID, gameData);
                        if(updateGame.error) {
                            console.log(updateGame.message);
                            break;
                        }
                        cmdFunc = await cmdFunc.replace(special[0], gameData.game_name);
                        break;
                    case 'title':
                        let title = special[3] || argument;
                        let updateTitle = await CHANNEL.setInformation(channelID, {title});
                        if(updateTitle.error) {
                            console.log(updateTitle.message);
                            break;
                        }
                        cmdFunc = cmdFunc.replace(special[0], title);
                        break;
                }
                break;
            case 'start':
                if(!special[2]) break;
                switch(special[2]) {
                    case 'prediction':
                        let prediction = special[3] || argument;
                        let predictionData = await COMMANDS.prediction('CREATE', channelID, prediction);
                        cmdFunc = cmdFunc.replace(special[0], predictionData.message);
                        break;
                    case 'poll':
                        let poll = special[3] || argument;
                        let pollData = await COMMANDS.poll('CREATE', channelID, poll);
                        cmdFunc = cmdFunc.replace(special[0], pollData.message);
                        break;
                }
                break;
            case 'raid':
                let raid = special[3] || argument;
                console.log({raid, special});
                let raidUserData = await getUserByLogin(raid);
                if(raidUserData.error) {
                    cmdFunc = cmdFunc.replace(special[0], raidUserData.message);
                    break;
                }
                let streamerID = raidUserData.data.id;
                let raidData = await CHANNEL.raid(channelID, streamerID);
                if(raidData.error) {
                    cmdFunc = cmdFunc.replace(special[0], raidData.message);
                    break;
                }
                cmdFunc = cmdFunc.replace(special[0], '');
                break;
            case 'unraid':
                let unraidData = await CHANNEL.unraid(channelID);
                if(unraidData.error) {
                    cmdFunc = cmdFunc.replace(special[0], unraidData.message);
                    break;
                }
                cmdFunc = cmdFunc.replace(special[0], '');
                break;
        }
    };

    return {cmdFunc, count}
}