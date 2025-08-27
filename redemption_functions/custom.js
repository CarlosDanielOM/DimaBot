const CHANNEL = require('../function/channel')
const rewardSchema = require('../schema/redemptionreward');
const { getUrl } = require('../util/dev');
const STREAMERS = require('../class/streamer');

async function customRedemptionReward(eventData, rewardData) {
    const { broadcaster_user_id, broadcaster_user_login} = eventData;

    let reward = await rewardSchema.findOne({channelID: broadcaster_user_id, rewardID: rewardData.id, type: 'custom'});
    if(!reward) return { error: true, message: 'Reward not found', status: 404, type: 'reward_not_found' };

    if(reward.costChange > 0) {
        let newCost = reward.cost + reward.costChange;
        if(newCost < 1) newCost = 1;
        let data = {
            title: reward.title,
            prompt: reward.prompt,
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
                where: 'customRedemptionReward',
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
    

    return { error: false, message: 'Reward updated', rewardMessage: reward.rewardMessage };
    
}

module.exports = customRedemptionReward;