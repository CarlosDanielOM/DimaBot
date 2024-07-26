const CHANNEL = require("../function/channel");
const { getUserByLogin } = require("../function/user/getuser");
const { getStreamerHeaderById } = require("../util/header");

async function removeVIPCommand(channelID, user) {
    let headers = await getStreamerHeaderById(channelID);

    user = user.split(' ')[0].toLowerCase();
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

    let removeVIP = await CHANNEL.removeVIP(channelID, userData.id);
    if(removeVIP.error) {
        return {
            error: true,
            message: removeVIP.message,
            status: removeVIP.status,
            type: removeVIP.type
        }
    }

    return {
        error: false,
        message: `${userData.display_name} has been removed from the VIP list`,
        status: 200,
        type: 'success'
    }
    
}

module.exports = removeVIPCommand;