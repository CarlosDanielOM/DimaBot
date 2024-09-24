const triggerSchema = require('../schema/trigger');
const triggerFileSchema = require('../schema/triggerfile');
const rewardSchema = require('../schema/redemptionreward');
const vipRedemtionFun = require('../redemption_functions/vip')
const songRequestFun = require('../redemption_functions/songrequest')
const customRedemptionFun = require('../redemption_functions/custom')
const { getUrl } = require('../util/dev');

const textConvertor = require('./text');
const { getStreamerHeaderById } = require('../util/header');

let modID = '698614112';

async function redeem(client, eventData) {
    const { broadcaster_user_id, broadcaster_user_login, user_id, user_login, user_input } = eventData;
    const { reward } = eventData;

    let rewardData = await rewardSchema.findOne({ channelID: broadcaster_user_id, rewardID: reward.id });

    if (!rewardData) return { error: true, message: 'No reward data found' };
    let vipMatch = reward.title.match(/VIP/);

    if (vipMatch) {
        let result = await vipRedemtionFun(eventData, reward);
        if (result.error) return client.say(broadcaster_user_login, `${result.message}`);
        let message = await textConvertor(broadcaster_user_id, eventData,result.rewardMessage, reward )
        client.say(broadcaster_user_login, `${message}`);
        return { error: false, message: 'VIP set' };
    }

    if(rewardData.rewardType == 'song') {
        let result = await songRequestFun(eventData, reward);
        if (result.error) return client.say(broadcaster_user_login, `${result.message}`);
        let message = await textConvertor(broadcaster_user_id, eventData, result.rewardMessage, reward)
        client.say(broadcaster_user_login, `${message}`);
        return { error: false, message: 'Song Requested' };
    }

    let trigger = await triggerSchema.findOne({ channelID: broadcaster_user_id, name: reward.title, type: 'redemption' }, 'file mediaType volume rewardID');

    if (!trigger) {
        let result = await customRedemptionFun(eventData, reward);
        if (result.error) return client.say(broadcaster_user_login, `${result.message}`);
        let message = await textConvertor(broadcaster_user_id, eventData, result.rewardMessage, reward)
        client.say(broadcaster_user_login, `${message}`);
        return { error: false, message: 'Reward Redeemed' };
    };

    let file = await triggerFileSchema.findOne({ name: trigger.file, fileType: trigger.mediaType }, 'fileUrl fileType');

    let customReward = await rewardSchema.findOne({ channelID: broadcaster_user_id, rewardID: trigger.rewardID});

    if (!file) return;

    let url = file.fileUrl;

    let triggerData = {
        url: url,
        mediaType: file.fileType,
        volume: trigger.volume
    }

    if (customReward.rewardCostChange > 0) {
        let newCost = customReward.rewardCost + customReward.rewardCostChange;
        let data = {
            title: customReward.rewardTitle,
            prompt: customReward.rewardPrompt,
            cost: newCost,
        }
        let response = await fetch(`${getUrl()}/rewards/${broadcaster_user_id}/${trigger.rewardID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.error) {
            console.log({ response, where: 'TriggerPriceUpdate', for: 'customReward.rewardCostChange > 0' })
            return { error: true, message: 'Error updating reward cost' }
        };
    }

    sendTrigger(broadcaster_user_id, triggerData);

}

module.exports = redeem;


async function sendTrigger(channelID, triggerData) {
    console.log({ channelID, triggerData, where: 'sendTrigger' })
    let streamerHeaders = await getStreamerHeaderById(channelID);
    let res = await fetch(`${getUrl()}/triggers/${channelID}/send`, {
        method: 'POST',
        body: JSON.stringify(triggerData),
        headers: streamerHeaders
    }); // Fetch the trigger

    if (res.error) {
        console.log({ res, where: 'sendTrigger', for: 'triggerData' })
        return { error: true, message: 'Error sending trigger' }
    };

    return { error: false, message: 'Trigger sent' }
}