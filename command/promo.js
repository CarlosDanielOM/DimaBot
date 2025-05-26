const getChannelInformation = require("../function/channel/getinformation");
const getChannelClips = require("../function/clip/getclips");
const showClip = require("../function/clip/showclip");
const { getUserByLogin, getUserById } = require("../function/user/getuser");
const { getClient } = require("../util/database/dragonfly");

async function promo(channelID, streamerName, sendClip = false) {
    const cacheClient = getClient();

    if(!sendClip) {
        let clipConnected = await cacheClient.get(`${channelID}:clip:connected`);
        if(clipConnected) {
            let queueExists = await cacheClient.exists(`${channelID}:clips:queue`);
            await cacheClient.rpush(`${channelID}:clips:queue`, streamerName);
            if(!queueExists) {
                let clipPlaying = await cacheClient.exists(`${channelID}:clip:playing`);
                if(!clipPlaying) {
                    await cacheClient.set(`${channelID}:clip:playing`, "true");
                    await cacheClient.set(`${channelID}:clips:queue:first`, streamerName);
                    //! Start the clip process for this user
                    await promo(channelID, streamerName, true);
                }
            }
        }
    }

    let streamerData = await getUserByLogin(streamerName, true);
    if(streamerData.error) {
        return streamerData;
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

    let clip = null;
    if(sendClip) {
        clip = await showClip(channelID, clips.data, streamerData.data, broadcasterData.data);
        if(clip.error) {
            return {
                error: true,
                message: clip.message,
                status: clip.status,
                type: clip.type,
                where: 'promo showClip'
            }
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
        message: !sendClip ? `Please, check out ${streamerChannelInfo.name} playing ${streamerChannelInfo.game} with the title "${streamerChannelInfo.title}" at https://twitch.tv/${streamerChannelInfo.login}` : ""
    }
    
}

module.exports = promo;