/**
 * This function sends a message to a channel's chat
 * @param {string} channelID - The ID of the channel to send the message to
 * @param {string} message - The message to send
 * @param {string} replyToMessageID - The ID of the message to reply to
 * @returns {Promise<{error: boolean, message: string, status: number, sent: boolean}>} The result of the operation
 */
require('dotenv').config();

const { getTwitchHelixUrl } = require("../../util/link");
const { getAppToken } = require("../../util/token");
const { getClient } = require("../../util/client");
const STREAMERS = require("../../class/streamer");

const modID = '698614112';

module.exports = async function sendChatMessage(channelID, message, replyToMessageID = null) {
    let appAccessToken = await getAppToken();
    
    if (!appAccessToken) {
        return { error: true, message: 'Failed to get app access token', status: 500 };
    }

    let body = {
        broadcaster_id: channelID,
        sender_id: modID,
        message: message
    };

    if (replyToMessageID) {
        body.reply_parent_message_id = replyToMessageID;
    }

    
    let response = await fetch(getTwitchHelixUrl('chat/messages'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${appAccessToken}`,
            'Client-Id': process.env.CLIENT_ID,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })

    let data = await response.json();

    if(data.status < 200 || data.status > 299) {
        // Fallback to TMI client.say if Helix API fails
        try {
            const streamer = await STREAMERS.getStreamerById(channelID);
            if (streamer && streamer.name) {
                const client = getClient();
                if (client) {
                    await client.say(streamer.name, message);
                    return { error: false, message: 'Message sent via TMI fallback', status: 200, sent: true, fallback: true };
                }
            }
        } catch (tmiError) {
            console.error('TMI fallback also failed:', tmiError);
        }
        return {error: true, message: data.message, status: data.status, type: data.error}
    }

    return {error: false, message: 'Message sent', status: data.status, sent: data.data[0].is_sent}
}