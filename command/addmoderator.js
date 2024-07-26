const CHANNEL = require('../function/channel')
const { getClient } = require('../util/database/dragonfly')
const STREAMERS = require('../class/streamer')
const { getUserByLogin } = require('../function/user/getuser')

async function addModerator(channelID, user) {
    let newModID = await getUserByLogin(user);

    if(newModID.error) {
        return {
            error: true,
            message: newModID.message,
            status: newModID.status,
            type: newModID.type
        }
    }

    let setModerator = await CHANNEL.addModerator(channelID, newModID.data.id);

    if(setModerator.error) {
        return {
            error: true,
            message: setModerator.message,
            status: setModerator.status,
            type: setModerator.type
        }
    }

    return { error: false, message: 'Moderator added' };
    
}

module.exports = addModerator;