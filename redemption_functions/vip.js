const CHANNEL = require('../function/channel')
const rewardSchema = require('../schema/redemptionreward');
const STREAMERS = require('../class/streamer');
const vipSchema = require('../schema/vip');
const { getUrl } = require('../util/dev');

async function vipRedemptionFun(eventData, rewardData) {
    const { broadcaster_user_id, broadcaster_user_login, user_id } = eventData;

    let vipReward = await rewardSchema.findOne({ channelID: broadcaster_user_id, rewardID: rewardData.id, type: 'vip' });

    if (!vipReward) {
        return {
            error: true,
            message: 'Reward not found',
            status: 404,
            type: 'reward_not_found'
        }
    }

    if(vipReward.costChange > 0) {
        let newCost = vipReward.cost + vipReward.costChange;
        let data = {
            title: vipReward.title,
            prompt: vipReward.prompt,
            cost: newCost,
        }

        let streamerToken = await STREAMERS.getStreamerTokenById(broadcaster_user_id);

        let response = await fetch(`${getUrl()}/rewards/${broadcaster_user_id}/${rewardData.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${streamerToken}`
            },
            body: JSON.stringify(data)
        })

        let responseData = await response.json();

        if(responseData.error) {
            console.log({
                response: responseData,
                where: 'vipRedemptionFun',
                channel: broadcaster_user_login,
            })
            return {
                error: true,
                message: 'Error updating reward',
                status: 500,
                type: 'error_updating_reward'
            }
        }
        
    }

    if(vipReward.duration > 0) {
        let date = new Date();
        date.setDate(date.getDate() + vipReward.duration);
        let expireDate = {
            day: date.getDate(),
            month: date.getMonth(),
            year: date.getFullYear(),
        }

        let vipData = {
            username: eventData.user_login,
            userID: eventData.user_id,
            channel: broadcaster_user_login,
            channelID: broadcaster_user_id,
            vip: true,
            duration: vipReward.duration,
            expireDate,
        }

        await new vipSchema(vipData).save();
        
    }

    let result = await CHANNEL.addVIP(broadcaster_user_id, user_id)
    if(result.error) {
        console.log({
            error: result,
            where: 'vipRedemptionFun',
            channel: broadcaster_user_login,
        })
        return {
            error: true,
            message: 'Error adding VIP',
            status: 500,
            type: 'error_adding_vip'
        }
    }

    return {
        error: false,
        message: 'VIP added',
        rewardMessage: vipReward.message,
    }
    
}

module.exports = vipRedemptionFun;