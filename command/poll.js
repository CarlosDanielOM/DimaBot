const POLL = require('../function/poll');

async function poll(action, channelID, argument) {
    let pollData = null;
    let pollID = null;

    let res = null;

    if(!action) {
        return {
            error: true,
            message: 'The action is required',
            status: 400,
            type: 'error'
        }
    }

    if(action !== 'CREATE') {
        let exists = await POLL.getPoll(channelID);
        if(exists.error) {
            return {
                error: true,
                message: exists.message,
                status: exists.status,
                type: exists.type
            }
        }

        if(!exists.data || exists.data.status !== 'ACTIVE') {
            return {
                error: true,
                message: 'There is no active poll',
                status: 404,
                type: 'error'
            }
        }

        pollID = exists.data.id;

        res = await POLL.endPoll(channelID, pollID, action);

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
            message: 'Poll ended',
            status: 200,
            type: 'success'
        }
    }
    
    let opt = argument.split(';');

    let choices = opt[1].split('\/').map(choice => {
        return {
            title: choice
        }
    });
    
    let opts = {
        title: opt[0],
        choices: choices,
        duration: Number(opt[2])
    }

    res = await POLL.createPoll(channelID, opts.title, opts.choices, opts.duration);

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
        message: 'Poll created',
        status: 200,
        type: 'success'
    }
    
}

module.exports = poll;