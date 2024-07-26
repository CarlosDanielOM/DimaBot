const CHAT = require('../function/chat')
const { getClient } = require("../util/database/dragonfly");

async function onlyEmotes(channelID, argument) {
    let cacheClient = getClient();
    let res = null;

    let seconds = 0;

    if(argument) {
        seconds = parseInt(argument);

        if(isNaN(seconds)) {
            return {
                error: true,
                message: 'The argument must be a number',
                status: 400,
                type: 'error'
            }
        }
    }

    let value = 1;
    let active = false;
    let status = await cacheClient.get(`${channelID}:chat:onlyemotes`);

    if(!status) {
        active = await CHAT.getOnlyEmotes(channelID);

        if(active.error) {
            return {
                error: true,
                message: active.message,
                status: active.status,
                type: active.type
            }
        }

        if(active.data) {
            value = 1;
        } else {
            value = 0;
        }
        await cacheClient.set(`${channelID}:chat:onlyemotes`, value, 'EX', 60 * 60);
        status = value;
    }

    if(status == 1) {
        value = 0;
        active = false;
    } else {
        value = 1;
        active = true;
    }

    res = await CHAT.setOnlyEmotes(channelID, active, channelID);

    if(res.error) {
        return {
            error: true,
            message: res.message,
            status: res.status,
            type: res.type
        }
    }

    await cacheClient.set(`${channelID}:chat:onlyemotes`, value, 'EX', 60 * 60);

    if(seconds > 0) {
        setTimeout(async () => {
            await CHAT.setOnlyEmotes(channelID, false, channelID);
            await cacheClient.set(`${channelID}:chat:onlyemotes`, 0, 'EX', 60 * 60);
        }, seconds * 1000);
    }

    return {
        error: false,
        message: `The chat is now ${active ? 'only emotes' : 'normal'} ${seconds > 0 ? `for ${seconds} seconds` : ''}`,
        status: 200,
        type: 'success'
    }
    
}

module.exports = onlyEmotes;