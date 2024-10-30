require('dotenv').config();
const COMMANDS = require('../command');
const categories = require('../function/search/categories')
const STREAMERS = require('../class/streamer');
const CHAT = require('../function/chat');
const CHANNEL = require('../function/channel');
const commandSchema = require('../schema/command');

const COOLDOWNS = require('../class/cooldown')

const commandsRegex = new RegExp(/^!([\p{L}\p{N}]+)(?:\W@?)?(.*)?$/u);
const linkRegex = new RegExp(/((http|https):\/\/)?(www\.)?[a-zA-Z-]+(\.[a-zA-Z-]{2})+(:\d+)?(\/\S*)?(\?\S+)?/gi);

const commandHandler = require('./command');
const { getClient } = require('../util/database/dragonfly');
const logger = require('../util/logger');

const modID = 698614112;
let channelInstances = new Map();

let isMod = false;
let user = null;

async function message(client, channel, tags, message) {
    let cacheClient = getClient();
    let streamer = await STREAMERS.getStreamerByName(channel);
    let channelID = streamer.user_id;
    let userLevel = await giveUserLevel(channel, tags, channelID);

    // Deletes links from chat if user is not a mod or streamer for certain channels
    let haslink = message.match(linkRegex);
    if(haslink && !tags.mod && tags.username !== channel && tags.username !== 'domdimabot') {
        if(channel == 'cdom201' || channel == 'ariascarletvt') {
            await CHAT.deleteMessage(tags.id, channelID, modID);
        }
    }

    let onCooldown = false;

    if(!channelInstances.has(channel)) {
        channelInstances.set(channel, new COOLDOWNS());
    }
    let channelInstance = channelInstances.get(channel);
    
    if(tags.mod || tags.username === channel) {
        isMod = true;
    }

    const [raw, command, argument] = message.match(commandsRegex) || [];

    if(!command) return;

    logger({command, argument, channel, channelID}, true, channelID, 'command');

    let commandFunc = await cacheClient.hget(`${channelID}:commands:${command}`, 'func');
    let commandUserLevel = await cacheClient.hget(`${channelID}:commands:${command}`, 'level');
    let commandCD = await cacheClient.hget(`${channelID}:commands:${command}`, 'cooldown');
    if(!commandFunc) {
        let commandData = await commandSchema.findOne({channelID, cmd: command, enabled: true});
        if(!commandData) return;
        // Saves command to cache
        await cacheClient.hset(`${channelID}:commands:${command}`, 'func', commandData.func);
        // Saves user level to cache
        await cacheClient.hset(`${channelID}:commands:${command}`, 'level', commandData.userLevel);
        // Saves cooldown to cache
        await cacheClient.hset(`${channelID}:commands:${command}`, 'cooldown', commandData.cooldown);
        commandFunc = commandData.func;
        commandUserLevel = commandData.userLevel;
        commandCD = commandData.cooldown;
    }
    if(!commandUserLevel) commandUserLevel = 7;

    if(userLevel < commandUserLevel && command !== 'game' && command !== 'title') {
        return;
    }

    if(channelInstance.hasCooldown(command)) {
        onCooldown = true;
    }

    if(onCooldown) {
        return;
    }
    
    let res = null;

    switch(commandFunc) {
        case 'ruletarusa':
            if((tags.username !== channel && !tags.mod) || !isMod) isMod = false;
            res = await COMMANDS.ruletarusa(channelID, tags.username, isMod);
            break;
        case 'anuncio':
            let announcementData = argument.split(';');
            let message = announcementData[0];
            let color = announcementData[1];

            res = await CHAT.announcement(channelID, modID, message, color);

            if(!res.error) res.message = '';
            
            break;
        case 'promo':
            res = await COMMANDS.promo(channelID, argument);
            break;
        case 'shoutout':
            res = await COMMANDS.shoutout(channelID, argument, 'purple');
            break;
        case 'predi':
            res = await COMMANDS.prediction('CREATE', channelID, argument);
            break;
        case 'endpredi':
            res = await COMMANDS.prediction('END', channelID, argument);
            break;
        case 'cancelpredi':
            res = await COMMANDS.prediction('CANCELED', channelID, argument);
            break;
        case 'lockpredi':
            res = await COMMANDS.prediction('LOCKED', channelID, argument);
            break;
        case 'poll':
            res = await COMMANDS.poll('CREATE', channelID, argument);
            break;
        case 'cancelpoll':
            res = await COMMANDS.poll('ARCHIVED', channelID, argument);
            break;
        case 'endpoll':
            res = await COMMANDS.poll('TERMINATED', channelID, argument);
            break;
        case 'game':
            res = await COMMANDS.game(channelID, argument, userLevel, commandUserLevel);
            break;
        case 'title':
            res = await COMMANDS.title(channelID, argument, userLevel, commandUserLevel, streamer.premium);
            break;
        case 'speach':
            res = await COMMANDS.speach(channelID, tags, argument);
            if(!res.error) res.message = '';
            break;
        case 'sumimetro':
            res = await COMMANDS.sumimetro(channelID, tags['display-name'], argument || tags['display-name']);
            break;
        case 'memide':
            res = COMMANDS.memide(tags['display-name']);
            break;
        case 'amor':
            res = COMMANDS.amor(tags, argument);
            break;
        case 'ponerla':
            res = COMMANDS.ponerla(tags['display-name']);
            break;
        case 'mecabe':
            res = COMMANDS.mecabe(tags['display-name']);
            break;
        case 'onlyemotes':
            res = await COMMANDS.onlyEmotes(channelID, argument);
            break;
        case 'createCommand':
            res = await COMMANDS.createCommand(channelID, argument);
            break;
        case 'deleteCommand':
            res = await COMMANDS.deleteCommand(channelID, argument, userLevel);
            break;
        case 'editCommand':
            res = await COMMANDS.editCommand(channelID, argument, userLevel);
            break;
        case 'followage':
            res = await COMMANDS.followage(channelID, argument || tags['display-name']);
            break;
        case 'createClip':
            client.say(channel, 'Saving clip...');
            res = await COMMANDS.createClip(channelID);
            break;
        case 'commands':
            res = await COMMANDS.commandList(channelID, userLevel);
            break;
        case 'clearChat':
            res = await CHAT.clearChat(channelID, channelID);
            break;
        case 'enableCommand':
            res = await COMMANDS.enableCommand(channelID, argument);
            break;
        case 'disableCommand':
            res = await COMMANDS.disableCommand(channelID, argument);
            break;
        case 'furrometro':
            res = await COMMANDS.furrometro(channelID, argument || tags['display-name']);
            break;
        case 'mod':
            res = await COMMANDS.addModerator(channelID, argument);
            break;
        case 'unmod':
            res = await COMMANDS.removeModerator(channelID, argument);
            break;
        case 'vip':
            res = await COMMANDS.addVIP(channelID, argument, tags);
            break;
        case 'unvip':
            res = await COMMANDS.removeVIP(channelID, argument);
            break;
        case 'createCommandTimer':
            res = await COMMANDS.createTimerCommand(channelID, argument);
            break;
        case 'deleteCommandTimer':
            res = await COMMANDS.deleteTimerCommand(channelID, argument);
            break;
        case 'editCommandTimer':
            res = await COMMANDS.editTimerCommand(channelID, argument);
            break;
        case 'spotifySongRequest':
            try {
                res = await COMMANDS.spotifySongRequest(channelID, argument);
            } catch (error) {
                console.log({error});
            }
            break;
        case 'countdownTimer':
            res = await COMMANDS.countdownTimer(channelID, argument);
            break;
        case 'vanish':
            res = await COMMANDS.vanish(channelID, tags);
            break;
        case 'duel':
            res = await COMMANDS.duel(channelID, channel, tags['username'], tags.mod, argument);
            break;
        case 'pechos':
            res = await COMMANDS.pechos(channelID, tags);
            break;
        default:
            let cmdHandler = await commandHandler(channelID, tags, command, argument);
            if(cmdHandler.error) {
                res = cmdHandler;
                break;
            }
            let cmd = cmdHandler.command;
            res = cmdHandler;
            break;
    }

    if(commandCD !== 0) {
        channelInstance.setCooldown(command, commandCD);
    }
    
    if(!res.message) return;
    
    client.say(channel, res.message)
    if(res.error) {
        console.log({res});
    }
    
}

module.exports = message;

async function giveUserLevel(channel, tags, channelID) {
    let userLevel = 1;
    let cacheClient = getClient();

    if(tags.subscriber) {
        userLevel = tags['badge-info'].subscriber + 1;
    }

    if(tags.vip) {
        userLevel = 5;
    }

    if (tags.subscriber) {
        if (tags['badge-info-raw'].split('/')[0] === 'founder') {
            userLevel = 6;
        }
    }

    if (tags.mod) {
        userLevel = 7;
    }

    let isEditor = await cacheClient.sismember(`${channelID}:channel:editors`, tags.username);
    if(isEditor == 1) {
        userLevel = 8;
    }

    //* TODO Super Mods level 9

    if (tags.username === channel) {
        userLevel = 10;
    }
    
    return userLevel;
    
}