/**
 * This function sends a message to a channel's chat
 * @param {string} channelID - The ID of the channel to send the message to
 * @param {string} message - The message to send
 * @param {string} replyToMessageID - The ID of the message to reply to
 * @returns {Promise<{error: boolean, message: string, status: number}>} The result of the operation
 */
require('dotenv').config();

const { getTwitchHelixUrl } = require("../../util/link");
const { getAppToken } = require("../../util/token");

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

    if(response.status !== 200) {
        return {error: true, message: 'Error sending message', status: response.status}
    }

    let data = await response.json();

    if(data.error) {
        return {error: true, message: data.message, status: data.status, type: data.error}
    }

    return {error: false, message: 'Message sent', status: response.status, sent: data.data[0].is_sent}
}