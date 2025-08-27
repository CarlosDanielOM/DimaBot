const rewardSchema = require('../schema/redemptionreward');
const channelSchema = require('../schema/channel');
const { getUrl } = require('../util/dev');
const STREAMERS = require('../class/streamer');

async function resetRedemptionCost(client, channelID) {
    let channel = await channelSchema.findOne({twitch_user_id: channelID});
    if(!channel) return { error: true, message: 'Channel not found', status: 404, type: 'channel_not_found' };
    if(!channel.premium) return { error: true, message: 'Channel not premium', status: 400, type: 'channel_not_premium' };

    let rewards = await rewardSchema.find({channelID: channelID, returnToOriginalCost: true});

    if(rewards.length === 0) return { error: true, message: 'No rewards found', status: 404, type: 'no_rewards_found' };

    for(let i = 0; i < rewards.length; i++) {
        let data = {
            title: rewards[i].title,
            prompt: rewards[i].prompt,
            cost: rewards[i].originalCost,
        }

        let streamerToken = await STREAMERS.getStreamerTokenById(channelID);

        let response = await fetch(`${getUrl()}/rewards/${channelID}/${rewards[i].rewardID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${streamerToken}`
            },
            body: JSON.stringify(data)
        });
    
        let responseData = await response.json();
    
        if(responseData.error) {
            console.log({
                response: responseData,
                where: 'resetRedemptionCost',
                channel: channel.twitch_user_login,
            })
            return {
                error: true,
                message: 'Error updating reward',
                status: 500,
                type: 'error_updating_reward'
            }
        }
    }

    return { error: false, message: 'Costs reset' };
    
}

module.exports = resetRedemptionCost;