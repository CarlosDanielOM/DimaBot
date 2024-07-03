const { getClient } = require("../../util/database/dragonfly");
const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function endPrediction(channelID, predictionID, status, winnerID = null) {
    const cache = getClient();

    let streamerHeader = await getStreamerHeaderById(channelID);

    let bodyData = {
        broadcaster_id: channelID,
        id: predictionID,
        status: status,
    }

    if(status !== 'RESOLVED' && status !== 'CANCELED' && status !== 'LOCKED') {
        return {
            error: true,
            message: 'Invalid status',
            status: 400,
            type: 'invalid_status',
        }
    }

    if(status === 'RESOLVED' && winnerID) {
        bodyData.winning_outcome_id = winnerID;
    }

    let response = await fetch(getTwitchHelixUrl('predictions'), {
        method: 'PATCH',
        headers: streamerHeader,
        body: JSON.stringify(bodyData),
    })

    let data = await response.json();

    if(data.error) {
        return {
            error: true,
            message: data.message,
            status: response.status,
            type: data.error,
        }
    }

    let prediction = data.data[0];

    let outcomes = prediction.outcomes.map(outcome => {
        return {
            id: outcome.id,
            title: outcome.title,
            users: outcome.users,
            channel_points: outcome.channel_points,
            top_predictors: outcome.top_predictors,
            color: outcome.color,
        }
    })

    let predictionData = {
        id: prediction.id,
        title: prediction.title,
        outcomes: outcomes,
        channelID: prediction.broadcaster_id,
        channel: prediction.broadcaster_login,
        status: prediction.status,
    }

    if(prediction.winning_outcome_id) {
        predictionData.winning_outcome_id = prediction.winning_outcome_id;
        let winning_outcome = outcomes.find(outcome => outcome.id === prediction.winning_outcome_id);
        predictionData.winning_outcome = winning_outcome;
    }

    await cache.del(`${predictionData.channel}:prediction`);

    return {
        error: false,
        data: predictionData,
    };
    
}

module.exports = endPrediction;