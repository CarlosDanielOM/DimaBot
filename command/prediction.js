const PREDICTION = require('../function/prediction');

async function prediction(action, channelID, argument = null) {
    let res = null;

    let predictionData = null;
    let predictionID = null;

    if(!action) {
        return {
            error: true,
            message: 'The action is required',
            status: 400,
            type: 'error'
        }
    }

    if(action !== 'CREATE') {
        let exists = await PREDICTION.getPrediction(channelID);
        if(exists.error) {
            return {
                error: true,
                message: exists.message,
                status: exists.status,
                type: exists.type
            }
        }

        if(!exists.data || (exists.data.status !== 'ACTIVE' && exists.data.status !== 'LOCKED')) {
            return {
                error: true,
                message: 'There is no active prediction',
                status: 404,
                type: 'error'
            }
        }

        predictionID = exists.data.id;
        predictionData = exists.data;

    }

    if(action === 'RESOLVED') {
        let winner = null;
        let won = Number(argument);

        if(isNaN(won)) {
            return {
                error: true,
                message: 'The argument should be a number',
                status: 400,
                type: 'error'
            }
        }

        if(won <= 0 || won > predictionData.outcomes.length) {
            return {
                error: true,
                message: 'The argument should be a number between 1 and ' + predictionData.outcomes.length,
                status: 400,
                type: 'error'
            }
        }

        won--;

        winner = predictionData.outcomes[won];

        res = await PREDICTION.endPrediction(channelID, predictionID, action, winner.id);

        if(res.error) {
            return {
                error: true,
                message: res.message,
                status: res.status,
                type: res.type
            }
        }

        return {
            error: false,
            message: 'The prediction has ended with the outcome: ' + winner.title,
            status: 200,
            type: 'success'
        }
        
    } else if(action === 'CREATE') {
        let opt = argument.split(';');

        let outcomes = opt[1].split('\/').map(outcome => {
            return {
                title: outcome
            }
        });

        opt[2] = Number(opt[2]);

        if(isNaN(opt[2])) {
            return {
                error: true,
                message: 'The duration should be a number',
                status: 400,
                type: 'error'
            }
        }
        
        res = await PREDICTION.createPrediction(channelID, opt[0], outcomes, Number(opt[2]));
        if(res.error) {
            return {
                error: true,
                message: res.message,
                status: res.status,
                type: res.type
            }
        }

        return {
            error: false,
            message: 'Prediction created',
            status: 200,
            type: 'success'
        }
    } else {
        res = await PREDICTION.endPrediction(channelID, predictionID, action);
        if(res.error) {
            return {
                error: true,
                message: res.message,
                status: res.status,
                type: res.type
            }
        }

        return {
            error: false,
            message: 'Prediction ' + action.toLowerCase(),
            status: 200,
            type: 'success'
        }
    }

    return res;
    
}

module.exports = prediction;