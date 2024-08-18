const { addModerator } = require("../function/channel");
const removeChannelModerator = require("../function/channel/removemoderator");
const ban = require("../function/moderation/ban");
const { getUserByLogin } = require("../function/user/getuser");
const { getClient } = require("../util/database/dragonfly");

async function vanish(channelID, username, isMod = false, modID = 698614112) {
    let cacheClient = getClient();

    let isEditor = await cacheClient.sismember(`${channelID}:channel:editors`, username.toLowerCase());

    if(isEditor == 1) {
        return {
            error: false,
            message: `As an editor you can't vanish from the chat.`,
            status: 403,
            type: 'error'
        }
    }
    
    let userData = await getUserByLogin(username);

    if(userData.error) {
        return {
            error: true,
            message: userData.message,
            status: userData.status,
            type: userData.type,
            where: 'userData'
        }
    }
    
    if(isMod) {
        let removeMod = await removeChannelModerator(channelID, userData.data.id);
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
            let addMod = await addModerator(channelID, userData.data.id);
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

    let timeout = await ban(channelID, userData.data.id, modID, 3, 'Vanish');
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
        message: `${userData.data.display_name} has vanished from the chat!`,
        status: 200,
        type: 'success'
    }
}

module.exports = vanish;