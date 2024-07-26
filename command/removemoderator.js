const CHANNEL = require("../function/channel");
const { getUserByLogin } = require("../function/user/getuser");

async function removeChannelModerator(channelID, user) {
    let userData = await getUserByLogin(user);
    if(userData.error) {
        return {
            error: true,
            message: userData.message,
            status: userData.status,
            type: userData.type
        }
    }
    userData = userData.data;

    let removeModerator = await CHANNEL.removeModerator(channelID, userData.id);
    if(removeModerator.error) {
        return {
            error: true,
            message: removeModerator.message,
            status: removeModerator.status,
            type: removeModerator.type
        }
    }

    return {
        error: false,
        message: `${userData.display_name} has been removed from the moderator list`,
        status: 200,
        type: 'success'
    }
    
}

module.exports = removeChannelModerator;