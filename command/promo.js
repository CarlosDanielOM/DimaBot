const getChannelInformation = require("../function/channel/getinformation");
const getChannelClips = require("../function/clip/getclips");
const showClip = require("../function/clip/showclip");
const { getUserByLogin, getUserById } = require("../function/user/getuser");

async function promo(channelID, streamerName) {
    let streamerData = await getUserByLogin(streamerName, true);
    if(streamerData.error) {
        return {
            error: true,
            message: streamerData.message,
            status: streamerData.status,
            type: streamerData.type,
            where: 'promo getUserByLogin'
        }
    }

    let broadcasterData = await getUserById(channelID, true);
    if(broadcasterData.error) {
        return {
            error: true,
            message: broadcasterData.message,
            status: broadcasterData.status,
            type: broadcasterData.type,
            where: 'promo getUserById'
        }
    }

    let streamerChannelData = await getChannelInformation(streamerData.data.id, true);
    if(streamerChannelData.error) {
        return {
            error: true,
            message: streamerChannelData.message,
            status: streamerChannelData.status,
            type: streamerChannelData.type,
            where: 'promo getChannelInformation'
        }
    }

    //* Needing to implement new clip system to add a queue to the clips
    
    let clips = await getChannelClips(streamerData.data.id, null, true);
    if(clips.error) {
        return {
            error: true,
            message: clips.message,
            status: clips.status,
            type: clips.type,
            where: 'promo getChannelClips'
        }
    }

    let clip = await showClip(channelID, clips.data, streamerData.data, broadcasterData.data);
    if(clip.error) {
        return {
            error: true,
            message: clip.message,
            status: clip.status,
            type: clip.type,
            where: 'promo showClip'
        }
    }

    let streamerChannelInfo = {
        game: streamerChannelData.data.game_name,
        title: streamerChannelData.data.title,
        login: streamerChannelData.data.broadcaster_login,
        name: streamerChannelData.data.broadcaster_name
    }

    return {
        error: false,
        streamerChannelInfo,
        clip: clip,
        message: `Please, check out ${streamerChannelInfo.name} playing ${streamerChannelInfo.game} with the title "${streamerChannelInfo.title}" at https://twitch.tv/${streamerChannelInfo.login}`
    }
    
}

module.exports = promo;