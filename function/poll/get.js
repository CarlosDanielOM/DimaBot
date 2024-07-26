const { getClient } = require('../../util/database/dragonfly');
const { getTwitchHelixUrl } = require('../../util/link');
const { getStreamerHeaderById } = require('../../util/header');

async function getPoll(channelID, pollID = null, cache = false) {
    let cacheClient = await getClient();

    let streamerHeader = await getStreamerHeaderById(channelID);

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID)

    if (pollID) {
        params.append('id', pollID);
    }

    let response = await fetch(getTwitchHelixUrl('polls', params), {
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
            message: 'Poll not found',
            status: response.status,
            type: data.error ?? 'not_found',
        }
    }

    let poll = data.data[0];

    let choices = poll.choices.map(choice => {
        return {
            id: choice.id,
            title: choice.title,
            votes: choice.votes,
        }
    })

    let pollData = {
        id: poll.id,
        title: poll.title,
        choices: choices,
        channelID: poll.broadcaster_id,
        channel: poll.broadcaster_login,
        status: poll.status,
    }

    if(cache) {
        await cacheClient.set(`${pollData.channel}:poll`, JSON.stringify(pollData));
    }
    
    return {
        error: false,
        data: pollData,
    };
    
}

module.exports = getPoll;