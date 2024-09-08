const CHANNEL = require("../function/channel");
const ban = require("../function/moderation/ban");
const { getUserByLogin } = require("../function/user/getuser");
const { getClient } = require("../util/database/dragonfly");

let timeoutTime = 10;

async function ruletarusa(channelID, user, isMod = false, modID = 698614112) {
    let cacheClient = getClient();

    let isEditor = await cacheClient.sismember(`${channelID}:channel:editors`, user.toLowerCase());
        
    if(isEditor == 1) {
        return {
            error: false,
            message: `Como editor no puedes jugar a la ruleta rusa.`,
            status: 403,
            type: 'error'
        }
    }
    
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

    if(userData.id == channelID) {
        return {
            error: false,
            message: `No puedes jugar a la ruleta rusa en tu propio canal.`,
            status: 403,
            type: 'error'
        }
    }
    
    let probability = Math.floor(Math.random() * 120) + 1;
    let dead = false;
    if(probability % 3 === 0) {
        dead = true;
    }

    if(!dead) {
        let exists = await cacheClient.exists(`${channelID}:roulette:${userData.id}`);
        if(exists == 1) {
            let attempt = await cacheClient.incr(`${channelID}:roulette:${userData.id}`);
        } else {
            let attempt = await cacheClient.set(`${channelID}:roulette:${userData.id}`, 1);
        }

        let attempts = await cacheClient.get(`${channelID}:roulette:${userData.id}`);
        
        return {
            error: false,
            message: `${userData.display_name} ha jalado el gatillo y la bala no ha sido disparada. Lleva ${attempts} intentos.`,
            status: 200,
            type: 'success'
        }
    }

    let timeIncrease = await cacheClient.get(`${channelID}:roulette:${userData.id}:died`);
    if(!timeIncrease) {
        timeIncrease = 1;
    } else {
        timeIncrease++;
    }

    timeoutTime = timeoutTime * timeIncrease;
    
    if(!isMod) {
        let timeout = await ban(channelID, userData.id, modID, timeoutTime, 'Ruleta rusa');
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

        let timeout = await ban(channelID, userData.id, modID, timeoutTime, 'Ruleta rusa');

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

    let attempts = await cacheClient.get(`${channelID}:roulette:${userData.id}`);
    await cacheClient.del(`${channelID}:roulette:${userData.id}`);

    let timeDied = await cacheClient.exists(`${channelID}:roulette:${userData.id}:died`);
    if(timeDied == 1) {
        await cacheClient.incr(`${channelID}:roulette:${userData.id}:died`);
    } else {
        await cacheClient.set(`${channelID}:roulette:${userData.id}:died`, 1);
    }

    return {
        error: false,
        message: `${userData.display_name} ha jalado el gatillo y la bala ha sido disparada. Se murio en el intento #${attempts}.`,
        status: 200,
        type: 'success'
    }
    
}

module.exports = ruletarusa;