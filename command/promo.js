const getChannelInformation = require("../function/channel/getinformation");
const getChannelClips = require("../function/clip/getclips");
const showClip = require("../function/clip/showclip");
const { getUserByLogin, getUserById } = require("../function/user/getuser");

async function promo(channelID, streamerName) {
    let streamerData = await getUserByLogin(streamerName);
    if(streamerData.error) {
        return {
            error: true,
            message: streamerData.message,
            status: streamerData.status,
            type: streamerData.type
        }
    }

    let broadcasterData = await getUserById(channelID);
    if(broadcasterData.error) {
        return {
            error: true,
            message: broadcasterData.message,
            status: broadcasterData.status,
            type: broadcasterData.type
        }
    }

    let streamerChannelData = await getChannelInformation(streamerData.data.id);
    if(streamerChannelData.error) {
        return {
            error: true,
            message: streamerChannelData.message,
            status: streamerChannelData.status,
            type: streamerChannelData.type
        }
    }
    
    let clips = await getChannelClips(streamerData.data.id);
    if(clips.error) {
        return {
            error: true,
            message: clips.message,
            status: clips.status,
            type: clips.type
        }
    }

    let clip = await showClip(channelID, clips.data, streamerData.data, broadcasterData.data);
    if(clip.error) {
        return {
            error: true,
            message: clip.message,
            status: clip.status,
            type: clip.type
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
        clip: clip
    }
    
}

module.exports = promo;