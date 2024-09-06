require('dotenv').config();
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const STREAMERS = require('../../../class/streamer');

const rewardSchema = require('../../../schema/redemptionreward');
const auth = require('../../../middleware/auth');
const { getStreamerHeaderById } = require('../../../util/header');
const { getTwitchHelixUrl } = require('../../../util/link');
const { subscribeTwitchEvent } = require('../../../util/eventsub');

router.use(auth);

router.get('/:channelID', async (req, res) => {
    const {channelID} = req.params;
    const query = req.query;
    const type = query.type || null;
    const id = query.id || null;

    if(id) {
        if(!mongoose.isValidObjectId(id)) {
            return res.status(400).send({
                error: 'Invalid ID',
                message: 'ID is not a valid ObjectID',
                status: 400
            });
        }
        const reward = await rewardSchema.find({channelID: channelID, _id: id});
        return res.status(200).send({
            data: reward,
            total: reward.length
        });
    }
    else if (type) {
        const rewards = await rewardSchema.find({channelID: channelID, rewardType: type});
        return res.status(200).send({
            data: rewards,
            total: rewards.length
        });
    }
    else {
        const rewards = await rewardSchema.find({channelID: channelID});
        return res.status(200).send({
            data: rewards,
            total: rewards.length
        });
    }
    
});

router.post('/:channelID', async (req, res) => {
    const {channelID} = req.params;
    const body = req.body;

    const streamer = await STREAMERS.getStreamerById(channelID);
    if(!streamer) {
        return res.status(404).send({
            error: 'Not Found',
            message: 'Streamer not found',
            status: 404
        });
    }

    if(!body.title || !body.cost) {
        return res.status(400).send({
            error: 'Bad Request',
            message: 'Title and cost are required',
            status: 400
        });
    }

    if(body.title.length > 45) {
        return res.status(400).send({
            error: 'Bad Request',
            message: 'Title is too long',
            status: 400
        });
    }
    
    if(body.cost < 0) {
        return res.status(400).send({
            error: 'Bad Request',
            message: 'Cost must be greater than 0',
            status: 400
        });
    }

    let rewardData = await CreateTwitchReward(channelID, body);

    const eventsubData = await subscribeTwitchEvent(channelID, 'channel.channel_points_custom_reward_redemption.add', '1', {broadcaster_user_id: channelID, reward_id: rewardData.id});

    if(rewardData.error) {
        return res.status(400).send({
            error: 'Bad Request',
            message: rewardData.error,
            status: 400
        });
    }
    
    const priceIncrease = body.priceIncrease || 0;
    const rewardMessage = body.rewardMessage || '';
    const returnToOriginalCost = body.returnToOriginalCost || false;

    let newReward = new rewardSchema({
        eventsubID: eventsubData.id,
        channelID: channelID,
        channel: streamer.name,
        rewardID: rewardData.id,
        rewardTitle: rewardData.title,
        rewardPrompt: rewardData.prompt,
        rewardCost: rewardData.cost,
        rewardOriginalCost: rewardData.cost,
        rewardIsEnabled: rewardData.is_enabled,
        rewardCostChange: priceIncrease,
        rewardMessage: rewardMessage,
        rewardReturnToOriginalCost: returnToOriginalCost,
        cooldown: body.cooldown || 0,
    });

    if(body.rewardType) {
        newReward.rewardType = body.rewardType;
    }
    if(body.rewardDuration) {
        newReward.rewardDuration = body.rewardDuration;
    }

    try {
        await newReward.save();
    } catch (error) {
        console.error('Error saving new reward: ', error);
        return res.status(500).send({
            error: 'Internal Server Error',
            message: 'Error saving new reward',
            status: 500
        });
    }

    return res.status(201).send({
        error: false,
        data: newReward
    });
    
});

router.delete('/:channelID/:id', async (req, res) => {
    const {channelID, id} = req.params;

    let reward = await rewardSchema.findOne({channelID: channelID, rewardID: id});
    if(!reward) {
        return res.status(404).send({
            error: 'Not Found',
            message: 'Reward not found',
            status: 404
        });
    }

    const streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);
    params.append('id', id);

    let response = await fetch(getTwitchHelixUrl('channel_points/custom_rewards', params), {
        method: 'DELETE',
        headers: streamerHeader
    });

    if(response.error) {
        console.log(`Error deleting reward ${id} for ${channelID}: ${response.error}`);
        return res.status(400).send({
            error: 'Bad Request',
            message: response.error,
            status: 400
        });
    }

    if(response.status !== 204) {
        console.log(`Error deleting reward ${id} for ${channelID}: ${response.status}`);
        return res.status(400).send({
            error: 'Bad Request',
            message: 'Error deleting reward',
            status: 400
        });
    }
    
    try {
        await rewardSchema.deleteOne({channelID: channelID, rewardID: id});
    } catch (error) {
        console.error('Error deleting reward: ', error);
        return res.status(500).send({
            error: 'Internal Server Error',
            message: 'Error deleting reward',
            status: 500
        });
    }

    return res.status(200).send({
        error: false,
        message: 'Reward deleted',
        status: 200
    });
    
});

router.patch('/:channelID/:id', async (req, res) => {
    const {channelID, id} = req.params;
    const body = req.body;

    let reward = await rewardSchema.findOne({channelID: channelID, rewardID: id});
    if(!reward) {
        return res.status(404).send({
            error: 'Not Found',
            message: 'Reward not found',
            status: 404
        });
    }

    let updatedReward = await PatchTwitchReward(channelID, body, id);
    if(updatedReward.error) {
        return res.status(400).send({
            error: 'Bad Request',
            message: updatedReward.error,
            status: 400
        });
    }

    let parsedBody = parseDBBody(body);

    let updatedRewardDB = null;
    
    try {
        updatedRewardDB = await rewardSchema.updateOne({channelID: channelID, rewardID: id}, parsedBody, {new: true});
    } catch (error) {
        console.error('Error updating reward: ', error);
        return res.status(500).send({
            error: 'Internal Server Error',
            message: 'Error updating reward',
            status: 500
        });
    }

    return res.status(200).send({
        error: false,
        data: updatedRewardDB
    });

});

module.exports = router;

async function CreateTwitchReward(channelID, body) {
    let streamerHeader = await getStreamerHeaderById(channelID);
    
    body = TwitchBodyParser(body);

    let params = new URLSearchParams(body);
    params.append('broadcaster_id', channelID);

    let response = await fetch(getTwitchHelixUrl('channel_points/custom_rewards', params), {
        method: 'POST',
        headers: streamerHeader,
        body: JSON.stringify(body)
    });

    let result = await response.json();

    if(result.error) {
        console.error(`Error creating reward for ${channelID}: ${result.error}`);
        return result;
    }
    
    let data = result.data[0];

    return data;
    
}

async function PatchTwitchReward(channelID, body, rewardID) {
    let streamerHeader = await getStreamerHeaderById(channelID);

    body = TwitchBodyParser(body);

    let params = new URLSearchParams(body);
    params.append('broadcaster_id', channelID);
    params.append('id', rewardID);

    let response = await fetch(getTwitchHelixUrl('channel_points/custom_rewards', params), {
        method: 'PATCH',
        headers: streamerHeader,
        body: JSON.stringify(body)
    });

    let result = await response.json();

    if(result.error) {
        console.error(`Error updating reward for ${channelID}: ${result.error} | ${result.message}`);
        return result;
    }

    let data = result.data[0];

    return data;
}

function TwitchBodyParser(body) {
    if(body.skipQueue) {
        body.should_redemptions_skip_request_queue = true;
        delete body.skipQueue;
    }

    if(body.cooldown && body.cooldown > 0) {
        body.is_global_cooldown_enabled = true;
        body.global_cooldown_seconds = body.cooldown;
        delete body.cooldown;
    } else {
        body.is_global_cooldown_enabled = false;
        body.global_cooldown_seconds = 0;
        delete body.cooldown;
    }

    if(body.userInput) {
        body.is_user_input_required = body.userInput;
        delete body.userInput;
    }
    
    return body;
}

function parseDBBody(body) {
    if(body.title) {
        body.rewardTitle = body.title;
        delete body.title;
    }
    if(body.prompt) {
        body.rewardPrompt = body.prompt;
        delete body.prompt;
    }
    if(body.cost) {
        body.rewardCost = body.cost;
        delete body.cost;
    }
    if(body.priceIncrease) {
        body.rewardCostChange = body.priceIncrease;
        delete body.priceIncrease;
    }
    if(body.message) {
        body.rewardMessage = body.message;
        delete body.message;
    }
    if(body.isEnabled) {
        body.rewardIsEnabled = body.isEnabled;
        delete body.isEnabled;
    }

    return body;
}