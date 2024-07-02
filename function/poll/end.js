const { getClient } = require("../../util/database/dragonfly");
const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function endPoll(channelID, pollID, status) {
    let cache = await getClient();
    let streamerHeader = await getStreamerHeaderById(channelID);

    if(status !== 'TERMINATED' && status !== 'ARCHIVED') {
        return {
            error: true,
            message: 'Invalid status',
            status: 400,
            type: 'invalid_status',
        }
    }

    let bodyData = {
        broadcaster_id: channelID,
        id: pollID,
        status: status,
    }

    let response = await fetch(getTwitchHelixUrl('polls'), {
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

    let poll = data.data[0];

    let choicesData = poll.choices.map(choice => {
        return {
            id: choice.id,
            title: choice.title,
            votes: choice.votes,
        }
    })

    let pollData = {
        id: poll.id,
        title: poll.title,
        choices: choicesData,
        channelID: poll.broadcaster_id,
        channel: poll.broadcaster_login,
    }

    await cache.del(`${pollData.channel}:poll`);

    return {
        error: false,
        data: pollData,
    };
    
}

module.exports = endPoll;