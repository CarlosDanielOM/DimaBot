const STREAMERS = require('../class/streamer');
const CHANNEL = require('../function/channel')
const CHAT = require('../function/chat')
const categories = require('../function/search/categories')

const specialCommandsFunc = (/\$\(([a-z]+)\s?([a-z0-9]+)?\s?([a-zA-Z0-9\s]+)?\)/g);

async function textConvertor(channelID, eventData, message, rewardData = {}) {
    let streamer = await STREAMERS.getStreamerById(channelID);
    let specials = message.match(specialCommandsFunc) || [];
    for(let i = 0; i < specials.length; i++) {
        specialCommandsFunc.lastIndex = 0;
        let cmdSpecial = specialCommandsFunc.exec(message);
        switch(cmdSpecial[1]) {
            case 'user':
                message = message.replace(cmdSpecial[0], eventData.user_name);
                break;
            case 'touser':
                if(eventData.user_input) {
                    message = message.replace(cmdSpecial[0], eventData.user_input);
                } else {
                    message = message.replace(cmdSpecial[0], eventData.user_name);
                }
                break;
            case 'random':
                let maxNumber = Number(cmdSpecial[2]) || 100;
                let randomNumber = Math.floor(Math.random() * maxNumber);
                message = message.replace(cmdSpecial[0], randomNumber);
                break;
            case 'randomuser':
                let chatters = await CHAT.getChatters(channelID, channelID);
                if(chatters.error) {
                    message = message.replace(cmdSpecial[0], chatters.message);
                    break;
                }
                let randomUser = chatters.chatters[Math.floor(Math.random() * chatters.chatters.length)].user_name;
                message = message.replace(cmdSpecial[0], randomUser);
                break;
            //! TWITCH COMMANDS
            case 'twitch':
                if(!cmdSpecial[2]) break;
                switch(cmdSpecial[2]) {
                    case 'subs':
                        let totalSubs = await CHANNEL.getSubscriptions(channelID);
                        message = message.replace(cmdSpecial[0], totalSubs.total);
                        break;
                    case 'title':
                        let title = await CHANNEL.getInformation(channelID);
                        message = message.replace(cmdSpecial[0], title.data.title);
                        break;
                    case 'game':
                        let game = await CHANNEL.getInformation(channelID);
                        message = message.replace(cmdSpecial[0], game.data.game_name);
                        break;
                    case 'channel':
                        message = message.replace(cmdSpecial[0], streamer.name);
                        break;
                }
                break;
            //! SET COMMANDS
            case 'set':
                if(!cmdSpecial[2]) break;
                switch(cmdSpecial[2]) {
                    case 'title':
                        let title = await CHANNEL.setInformation(channelID, {title: cmdSpecial[3]});
                        if(title.error) {
                            message = message.replace(cmdSpecial[0], title.message);
                        } else {
                            message = message.replace(cmdSpecial[0], cmdSpecial[3]);
                        }
                        break;
                    case 'game':
                        let category = await categories(cmdSpecial[3]);
                        if(category.error) {
                            message = message.replace(cmdSpecial[0], category.message);
                        } else {
                            let gameData = {
                                game_id: category.data[0].id,
                                game_name: category.data[0].name
                            };
                            let game = await CHANNEL.setInformation(channelID, gameData);
                            if(game.error) {
                                message = message.replace(cmdSpecial[0], game.message);
                            } else {
                                message = message.replace(cmdSpecial[0], category.data[0].name);
                            }
                        }
                        break;
                }
                break;
            //! REWARD COMMANDS
            case 'reward':
                if(!cmdSpecial[2]) break;
                switch(cmdSpecial[2]) {
                    case 'cost':
                        let cost = rewardData.cost || 0;
                        message = message.replace(cmdSpecial[0], cost);
                        break;
                    case 'title':
                        let title = rewardData.title || 'No title';
                        message = message.replace(cmdSpecial[0], title);
                        break;
                    case 'prompt':
                        let prompt = rewardData.prompt || 'No prompt';
                        message = message.replace(cmdSpecial[0], prompt);
                        break;
                    case 'input':
                        let input = rewardData.user_input || '';
                        message = message.replace(cmdSpecial[0], input);
                        break;
                }
                break;
            //! AD COMMANDS
            case 'ad':
                if(!cmdSpecial[2]) break;
                switch(cmdSpecial[2]) {
                    case 'time':
                        let time = eventData.duration_seconds || 0;
                        message = message.replace(cmdSpecial[0], time);
                        break;
                }
                break;
            //! RAID COMMANDS
            case 'raid':
                if (!cmdSpecial[2]) break;
                let raiderChannelData = await CHANNEL.getInformation(eventData.from_broadcaster_user_id);
                if(raiderChannelData.error) {
                    message = message.replace(cmdSpecial[0], raiderChannelData.message);
                    break;
                }
                switch (cmdSpecial[2]) {
                    case 'channel':
                        let raidChannel = eventData.from_broadcaster_user_name;
                        message = message.replace(cmdSpecial[0], raidChannel);
                        break;
                    case 'viewers':
                        let viewers = eventData.viewers;
                        message = message.replace(cmdSpecial[0], viewers);
                        break;
                    case 'game': 
                        let game = raiderChannelData.game_name;
                        message = message.replace(cmdSpecial[0], game);
                        break;
                    case 'title':
                        let title = raiderChannelData.title;
                        message = message.replace(cmdSpecial[0], title);
                        break;
                    case 'language':
                        let language = raiderChannelData.broadcaster_language;
                        message = message.replace(cmdSpecial[0], language);
                        break;
                }
                break;
            //! BAN COMMANDS
            case 'ban':
                if (!cmdSpecial[2]) break;
                switch (cmdSpecial[2]) {
                    case 'time':
                        if(eventData.is_permanent) {
                            message = message.replace(cmdSpecial[0], 'permanently');
                            break;
                        
                        };
                        let start = eventData.banned_at;
                        let end = eventData.ends_at;
                        let startDate = new Date(start);
                        let endDate = new Date(end);
                        let time = Math.floor((endDate - startDate) / 1000);
                        message = message.replace(cmdSpecial[0], time);
                        break;
                    case 'reason':
                        let reason = eventData.reason;
                        message = message.replace(cmdSpecial[0], reason);
                        break;
                    case 'mod':
                        let mod = eventData.moderator_user_name;
                        message = message.replace(cmdSpecial[0], mod);
                        break;
                    default:
                        break;
                }
                break;
            case 'vip':
                break;
            case 'cheer':
                if(!cmdSpecial[2]) break;
                switch(cmdSpecial[2]) {
                    case 'amount':
                        let amount = eventData.bits;
                        message = message.replace(cmdSpecial[0], amount);
                        break;
                    case 'message':
                        let userMessage = eventData.message;
                        message = message.replace(cmdSpecial[0], userMessage);
                        break;
                }
                break;
        }
    }
    return message;
}

module.exports = textConvertor