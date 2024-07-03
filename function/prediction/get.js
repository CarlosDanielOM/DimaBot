const { getClient } = require("../../util/database/dragonfly");
const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function getPrediction(channelID, predictionID = null, cache = false) {
    let cacheClient = getClient();

    let streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID)

    if (predictionID) {
        params.append('id', predictionID);
    }

    let response = await fetch(getTwitchHelixUrl('predictions', params), {
        headers: streamerHeader
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

    if(data.data.length === 0 || response.status === 404) {
        return {
            error: true,
            message: 'Prediction not found',
            status: response.status,
            type: data.error ?? 'not_found',
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

    if(cache) {
        await cacheClient.set(`${predictionData.channel}:prediction`, JSON.stringify(predictionData));
    }

    return {
        error: false,
        data: predictionData,
    };
    
}

module.exports = getPrediction;