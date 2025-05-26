const COOLDOWN = require('../class/cooldown.js');
const getChannelInformation = require('../function/channel/getinformation.js');
const CHAT = require('../function/chat');
const getChannelClips = require('../function/clip/getclips.js');
const showClip = require('../function/clip/showclip.js');
const { getUserByLogin } = require('../function/user/getuser.js');
const { getClient } = require('../util/database/dragonfly.js');
const promo = require('./promo.js');

const cooldown = new COOLDOWN();

async function shoutout(channelID, raider, color = 'purple', modID = 698614112) {
    const cacheClient = getClient();

    let clipConnected = await cacheClient.get(`${channelID}:clip:connected`);
    if(clipConnected) {
        let queueExists = await cacheClient.exists(`${channelID}:clips:queue`);
        await cacheClient.rpush(`${channelID}:clips:queue`, raider);
        if(!queueExists) {
            const playing = await cacheClient.exists(`${channelID}:clip:playing`);
            if(!playing) {
                await cacheClient.set(`${channelID}:clip:playing`, "true");
                await cacheClient.set(`${channelID}:clips:queue:first`, raider);
                //! Start the clip process for this user
                await promo(channelID, raider, true);
            }
        }
    }
    
    let raiderData = await getUserByLogin(raider, true);
    if(raiderData.error) {
        return {
            error: true,
            message: raiderData.message,
            status: raiderData.status,
            type: raiderData.type,
            where: 'raiderData'
        }
    }
    raiderData = raiderData.data;

    if(!channelID || !raiderData.id) {
        return {
            error: true,
            message: 'Missing parameters',
            status: 400,
            type: 'error'
        }
    }

    let raiderChannelData = await getChannelInformation(raiderData.id, true);
    if(raiderChannelData.error) {
        return {
            error: true,
            message: raiderChannelData.message,
            status: raiderChannelData.status,
            type: raiderChannelData.type,
            where: 'shoutout getChannelInformation'
        }
    }
    
    let raiderChannel = {
        name: raiderChannelData.data.broadcaster_name,
        login: raiderChannelData.data.broadcaster_login,
        game: raiderChannelData.data.game_name,
    }

    let message = `Check out ${raiderChannel.name} at https://twitch.tv/${raiderChannel.login} and give them a follow! They were last playing ${raiderChannel.game}`;

    let anounce = await CHAT.announcement(channelID, modID, message, color);
    if(anounce.error) {
        return {
            error: true,
            message: anounce.message,
            status: anounce.status,
            type: anounce.type,
            where: 'shoutout announcement'
        }
    }

    if(!cooldown.hasCooldown(channelID)) {
        cooldown.setCooldown(channelID, 120);
        CHAT.shoutout(channelID, raiderData.id, modID)
    }

    //* Needing to implement new clip system to add a queue to the clips

    if(false) {
        let clips = await getChannelClips(raiderData.id, null, true);
        if(clips.error) {
            return {
                error: true,
                message: clips.message,
                status: clips.status,
                type: clips.type,
            where: 'shoutout getChannelClips'
        }
    }

    let clip = await showClip(channelID, clips.data, raiderData, raiderChannelData);
    if(clip.error) {
        return {
                error: true,
                message: clip.message,
                status: clip.status,
                type: clip.type,
                where: 'shoutout showClip'
            }
        }
    }

    return {
        soClip: clip,
        soChannel: raiderChannel,
        error: false,
        message: '',
        status: 200,
        type: 'success'
    }
}

module.exports = shoutout;