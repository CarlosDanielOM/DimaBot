const CHANNEL = require('../function/channel')
const STREAMERS = require('../class/streamer')
const vipSchema = require('../schema/vip')

const days = 24 * 60 * 60 * 1000;

async function addVIPCommand(channelID, argument, tags) {
    if(tags.vip) {
        return {
            error: true,
            message: 'User is already a VIP',
            status: 400,
            type: 'user_already_vip'
        }
    }

    if(tags.mod) {
        return {
            error: true,
            message: 'User is a moderator',
            status: 400,
            type: 'user_is_moderator'
        }
    }
    
    if(!argument) {
        return {
            error: true,
            message: 'No argument provided',
            status: 400,
            type: 'no_argument_provided'
        }
    }
    
    let [user, duration] = argument.split(' ');

    let userData = await CHANNEL.getUserByLogin(user);
    if(userData.error) {
        return {
            error: true,
            message: userData.message,
            status: userData.status,
            type: userData.type
        }
    }

    let vipAdded = await CHANNEL.addVIP(channelID, userData.data.id);
    if(vipAdded.error) {
        return {
            error: true,
            message: vipAdded.message,
            status: vipAdded.status,
            type: vipAdded.type
        }
    }

    if(duration) {
        if(isNaN(duration)) {
            return {
                error: true,
                message: 'Invalid duration',
                status: 400,
                type: 'invalid_duration'
            }
        }

        if(duration < 1) {
            return {
                error: true,
                message: 'Duration must be at least 1 day',
                status: 400,
                type: 'duration_too_short'
            }
        }

        if(duration > 365) {
            return {
                error: true,
                message: 'Duration cannot be longer than 365 days',
                status: 400,
                type: 'duration_too_long'
            }
        }

        let now = Date.now();
        let expireTime = now + (duration * days);
        let dateToExpire = new Date(expireTime);
        let expireDate = {
            day: dateToExpire.getDate(),
            month: dateToExpire.getMonth(),
            year: dateToExpire.getFullYear(),
        }

        let streamer = await STREAMERS.getStreamerById(channelID);

        let vipData = {
            username: userData.data.login,
            userID: userData.data.id,
            channel: streamer.name,
            channelID,
            duration,
            expireDate
        }

        try {
            await new vipSchema(vipData).save();
        } catch (error) {
            console.log({
                error,
                where: 'addVIPCommand',
                channel: streamer.name,
            })
            return {
                error: true,
                message: 'Error saving VIP data',
                status: 500,
                type: 'error_saving_vip_data'
            }
        }
        
    }

    return {
        error: false,
        message: `${userData.data.login} has been added as a VIP ${duration ? `for ${duration} days` : ''}`
    }
    
}

module.exports = addVIPCommand;