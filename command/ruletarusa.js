const CHANNEL = require("../function/channel");
const ban = require("../function/moderation/ban");
const { getUserByLogin } = require("../function/user/getuser");

async function ruletarusa(channelID, user, isMod = false, modID = 698614112) {
    let userData = await getUserByLogin(user);
    if(userData.error) {
        return {
            error: true,
            message: userData.message,
            status: userData.status,
            type: userData.type,
            where: 'userData'
        }
    }
    userData = userData.data;
    
    let probability = Math.floor(Math.random() * 120) + 1;
    let dead = false;
    if(probability % 3 === 0) {
        dead = true;
    }

    if(!dead) {
        return {
            error: false,
            message: `${userData.display_name} ha jalado el gatillo y la bala no ha sido disparada.`,
            status: 200,
            type: 'success'
        }
    }
    
    if(!isMod) {
        let timeout = await ban(channelID, userData.id, modID, 150, 'Ruleta rusa');
        if(timeout.error) {
            return {
                error: true,
                message: timeout.message,
                status: timeout.status,
                type: timeout.type,
                where: 'timeout no mod'
            }
        }
    } else {
        let removeMod = await CHANNEL.removeModerator(channelID, userData.id);
        if(removeMod.error) {
            return {
                error: true,
                message: removeMod.message,
                status: removeMod.status,
                type: removeMod.type,
                where: 'removeMod'
            }
        }

        let timeout = await ban(channelID, userData.id, modID, 150, 'Ruleta rusa');

        if(timeout.error) {
            return {
                error: true,
                message: timeout.message,
                status: timeout.status,
                type: timeout.type,
                where: 'timeout mod'
            }
        }

        setTimeout(async () => {
            let addMod = await CHANNEL.addModerator(channelID, userData.id);
            if(addMod.error) {
                return {
                    error: true,
                    message: addMod.message,
                    status: addMod.status,
                    type: addMod.type,
                    where: 'addMod'
                }
            }
        }, 1000 * 160);
    }

    return {
        error: false,
        message: `${userData.display_name} ha jalado el gatillo y la bala ha sido disparada.`,
        status: 200,
        type: 'success'
    }
    
}

module.exports = ruletarusa;