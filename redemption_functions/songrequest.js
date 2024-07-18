const rewardSchema = require('../schema/redemptionreward');

async function spotifySongRequest(eventData, reward) {
    let userInput = eventData.user_input;
    let rewardData = await rewardSchema.findOne({channelID: eventData.broadcaster_user_id, rewardID: reward.id });
    if(!rewardData) {
        return {
            error: true,
            message: 'Reward not found',
            status: 404,
            type: 'reward_not_found'
        }
    }
    
    if(!userInput) {
        return {
            error: true,
            message: 'No song provided',
            status: 400,
            type: 'no_song_provided'
        }
    }
    
    let response = await fetch(`https://spotify.domdimabot.com/song/queue`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            channelID: eventData.broadcaster_user_id,
            song: userInput
        })
    })

    let data = await response.json();

    if (data.error) return { error: true, message: data.message };

    let rewardMessage = rewardData.rewardMessage;

    return { error: false, message: 'Song queued', rewardMessage };

}

module.exports = spotifySongRequest;