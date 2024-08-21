const { addModerator } = require("../function/channel");
const removeChannelModerator = require("../function/channel/removemoderator");
const ban = require("../function/moderation/ban");
const { getUserByLogin } = require("../function/user/getuser");
const { getClient } = require("../util/database/dragonfly");

async function vanish(channelID, tags, modID = 698614112) {
    let cacheClient = getClient();
    console.log(tags)

    let isEditor = await cacheClient.sismember(`${channelID}:channel:editors`, tags.username.toLowerCase());

    if(isEditor == 1) {
        return {
            error: false,
            message: `As an editor you can't vanish from the chat.`,
            status: 403,
            type: 'error'
        }
    }
    
    if(tags.mod) {
        let removeMod = await removeChannelModerator(channelID, tags['user-id']);
        if(removeMod.error) {
            return {
                error: true,
                message: removeMod.message,
                status: removeMod.status,
                type: removeMod.type,
                where: 'removeMod'
            }
        }

        setTimeout(async () => {
            let addMod = await addModerator(channelID, tags['user-id']);
            if(addMod.error) {
                console.log({
                    error: true,
                    message: addMod.message,
                    status: addMod.status,
                    type: addMod.type,
                    where: 'addMod'
                });
            }
        }, 1000 * 10);
        
    }

    let timeout = await ban(channelID, tags['user-id'], modID, 3, 'Vanish');
    if(timeout.error) {
        return {
            error: true,
            message: timeout.message,
            status: timeout.status,
            type: timeout.type,
            where: 'timeout'
        }
    }

    return {
        error: false,
        message: `${tags['display-name']} has vanished from the chat!`,
        status: 200,
        type: 'success'
    }
}

module.exports = vanish;