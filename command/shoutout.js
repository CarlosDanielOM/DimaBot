const COOLDOWN = require('../class/cooldown.js');
const getChannelInformation = require('../function/channel/getinformation.js');
const CHAT = require('../function/chat');
const getChannelClips = require('../function/clip/getclips.js');
const showClip = require('../function/clip/showclip.js');
const { getUserByLogin } = require('../function/user/getuser.js');

const cooldown = new COOLDOWN();

async function shoutout(channelID, raider, color = 'purple', modID = 698614112) {
    let raiderData = await getUserByLogin(raider);
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

    let raiderChannelData = await getChannelInformation(raiderData.id);
    if(raiderChannelData.error) {
        return {
            error: true,
            message: raiderChannelData.message,
            status: raiderChannelData.status,
            type: raiderChannelData.type,
            where: 'shoutout getChannelInformation'
        }
    }

    let clips = await getChannelClips(raiderData.id);
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

    let raiderChannel = {
        name: raiderChannelData.data.broadcaster_name,
        login: raiderChannelData.data.broadcaster_login,
        game: raiderChannelData.data.game_name,
    }

    let message = `Check out ${raiderChannel.name} at https://twitch.tv/${raiderChannel.login} and give them a follow! They were last playing ${raiderChannel.game}`;

    let anounce = CHAT.announcement(channelID, channelID, message, color);
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

    return {
        soClip: clip,
        soChannel: raiderChannel,
        error: false,
        message: 'Shoutout sent',
        status: 200,
        type: 'success'
    }
}

module.exports = shoutout;