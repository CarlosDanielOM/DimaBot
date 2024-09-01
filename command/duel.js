const ban = require("../function/moderation/ban");
const { getUserByLogin } = require("../function/user/getuser");
const { getClient } = require("../util/database/dragonfly");

async function duel(channelID, channel, user, userMod, argument, modID = 698614112) {
    if(!user || !argument) {
        return {
            error: true,
            message: 'You must provide a user to duel.'
        }
    }
    let decision = argument.split(' ')[1] || false;
    argument = argument.split(' ')[0];
    console.log({argument, decision});
    if(argument.toLowerCase() === user.toLowerCase()) {
        return {
            error: true,
            message: 'You cannot duel yourself.'
        }
    }
    if(argument === channel || user.toLowerCase() === channel) {
        return {
            error: true,
            message: 'You cannot duel the channel owner.'
        }
    }
    let cacheClient = getClient();
    let editor = await cacheClient.sismember(`${channelID}:channel:editors`, user.toLowerCase());

    if(editor == 1) {
        return {
            error: true,
            message: 'As an Editor, you cannot duel.'
        }
    }

    editor = await cacheClient.sismember(`${channelID}:channel:editors`, argument.toLowerCase());
    if(editor == 1) {
        return {
            error: true,
            message: 'You cannot duel an Editor.'
        }
    }

    if(decision == 'accept') {
        let exists = await cacheClient.exists(`${channelID}:duel:${argument.toLowerCase()}:${user.toLowerCase()}`);
        if(exists) {
            let isMod = await cacheClient.get(`${channelID}:duel:${argument.toLowerCase()}:${user.toLowerCase()}`);
            await cacheClient.del(`${channelID}:duel:${argument.toLowerCase()}:${user.toLowerCase()}`);
            let probability = Math.floor(Math.random() * 121);
            let winner = probability % 2;
            if(winner === 0) {
                let userData = await getUserByLogin(user);
                userData = userData.data;

                let timeout = await ban(channelID, userData.id, modID, 150, 'Duel');

                if(timeout.error) {
                    return {
                        error: true,
                        message: timeout.message
                    }
                }
                
                return {
                    error: false,
                    message: `@${argument} has won the duel against @${user}.`
                }
            } else {
                let user = await getUserByLogin(argument);
                user = user.data;

                let timeout = await ban(channelID, user.id, modID, 150, 'Duel');

                if(timeout.error) {
                    return {
                        error: true,
                        message: timeout.message
                    }
                }
                
                return {
                    error: false,
                    message: `@${user} has won the duel against @${argument}.`
                }
            }
        }
    } else if (decision === 'decline') {
        await cacheClient.del(`${channelID}:duel:${user.toLowerCase()}:${argument.toLowerCase()}`);
        return {
            error: false,
            message: `@${user} has declined the duel challenge from @${argument}.`
        }
    } else {
        let exists = await cacheClient.exists(`${channelID}:duel:${user.toLowerCase()}:${argument.toLowerCase()}`);
        if(exists) {
            return {
                error: true,
                message: 'You already challenged this user to a duel.'
            }
        }
    
        if(userMod) {
            await cacheClient.set(`${channelID}:duel:${user.toLowerCase()}:${argument.toLowerCase()}`, '1');
        } else {
            await cacheClient.set(`${channelID}:duel:${user.toLowerCase()}:${argument.toLowerCase()}`, '0');
        }
        
        await cacheClient.expire(`${channelID}:duel:${user.toLowerCase()}:${argument.toLowerCase()}`, 180);
    
        return {
            error: false,
            message: `@${user} has challenged @${argument} to a duel! Type !duel ${user} accept to accept the challenge or !duel ${user} decline to decline the challenge.`
        }
    }

    return {
        error: true,
        message: 'An error occurred while processing the duel.'
    }
}

module.exports = duel;