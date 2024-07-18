const { getClient } = require("../../util/database/dragonfly");
const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function createPrediction(channelID, title, outcomes, duration, cache = false) {
    const cacheClient = getClient();

    const streamerHeader = await getStreamerHeaderById(channelID);

    const bodyData = {
        broadcaster_id: channelID,
        title: title,
        outcomes: outcomes,
        duration: Number(duration),
    }

    const response = await fetch(getTwitchHelixUrl('predictions'), {
        method: 'POST',
        headers: streamerHeader,
        body: JSON.stringify(bodyData),
    })

    const data = await response.json();

    if(data.error) {
        return {
            error: true,
            message: data.message,
            status: response.status,
            type: data.error,
        }
    }

    const prediction = data.data[0];

    const outcomesData = prediction.outcomes.map(outcome => {
        return {
            id: outcome.id,
            title: outcome.title,
            users: outcome.users,
            channel_points: outcome.channel_points,
            top_predictors: outcome.top_predictors,
            color: outcome.color,
        }
    })

    const predictionData = {
        id: prediction.id,
        title: prediction.title,
        outcomes: outcomesData,
        channelID: prediction.broadcaster_id,
        channel: prediction.broadcaster_login,
        status: prediction.status,
    }

    if(prediction.winning_outcome_id) {
        predictionData.winning_outcome_id = prediction.winning_outcome_id;
        const winning_outcome = outcomesData.find(outcome => outcome.id === prediction.winning_outcome_id);
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

module.exports = createPrediction;