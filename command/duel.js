const ban = require("../function/moderation/ban");
const getChannelModerators = require("../function/moderation/getmoderators");
const { getUserByLogin } = require("../function/user/getuser");
const { getClient } = require("../util/database/dragonfly");
const removeChannelModerator = require("../function/channel/removemoderator");
const addChannelModerator = require("../function/channel/addmoderator");

async function duel(channelID, channel, user, userMod, argument, modID = 698614112) {
    if(!user || !argument) {
        return {
            error: true,
            message: 'You must provide a user to duel.'
        }
    }
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

    if(argument == 'accept') {
        let exists = await cacheClient.exists(`${channelID}:duel:${user.toLowerCase()}`);
        if(exists) {
            let duelist = await cacheClient.get(`${channelID}:duel:${user.toLowerCase()}`);
            await cacheClient.del(`${channelID}:duel:${user.toLowerCase()}`);
            let probability = Math.floor(Math.random() * 121);
            let winner = probability % 2;
            if(winner === 0) {
                let userData = await getUserByLogin(duelist);
                userData = userData.data;

                let moderator = await getChannelModerators(channelID, [userData.id]);
                if(moderator.error) {
                    return {
                        error: true,
                        message: moderator.message
                    }
                }

                if(moderator.data.length > 0) {
                    await removeChannelModerator(channelID, moderator.ids[0]);
                    setTimeout(async () => {
                        let add = await addChannelModerator(channelID, moderator.ids[0]);
                        if(add.error) {
                            console.error({add});
                        }
                    }, 70000);
                }

                let timeout = await ban(channelID, userData.id, modID, 60, 'Duel');

                if(timeout.error) {
                    return {
                        error: true,
                        message: timeout.message
                    }
                }
                
                return {
                    error: false,
                    message: `@${user} has won the duel against @${duelist}.`
                }
            } else {
                let userData = await getUserByLogin(user);
                userData = userData.data;

                let moderator = await getChannelModerators(channelID, [userData.id]);
                if(moderator.error) {
                    return {
                        error: true,
                        message: moderator.message
                    }
                }

                if(moderator.data.length > 0) {
                    let add = await removeChannelModerator(channelID, moderator.ids[0]);

                    if(add.error) {
                        console.error({add});
                    }
                    
                    setTimeout(async () => {
                        await addChannelModerator(channelID, moderator.ids[0]);
                    }, 70000);
                }

                let timeout = await ban(channelID, userData.id, modID, 60, 'Duel');

                if(timeout.error) {
                    return {
                        error: true,
                        message: timeout.message
                    }
                }
                
                return {
                    error: false,
                    message: `@${duelist} has won the duel against @${user}.`
                }
            }
        } else {
            return {
                error: true,
                message: 'There is no duel challenge to accept.'
            }
        }
    } else if (argument === 'decline') {
        await cacheClient.del(`${channelID}:duel:${user.toLowerCase()}`);
        return {
            error: false,
            message: `@${user} has declined the duel challenge from @${argument}.`
        }
    } else {
        await cacheClient.set(`${channelID}:duel:${argument.toLowerCase()}`, user.toLowerCase());
        
        await cacheClient.expire(`${channelID}:duel:${argument.toLowerCase()}`, 180);
    
        return {
            error: false,
            message: `@${user} has challenged @${argument} to a duel! Type \"!duel accept\" to accept the challenge or \"!duel decline\" to decline the challenge.`
        }
    }

    return {
        error: true,
        message: 'An error occurred while processing the duel.'
    }
}

module.exports = duel;