const { getClient } = require("../../util/database/dragonfly");
const { getStreamerHeaderById } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function createPoll(channelID, title, choices, duration, cache = false) {
    let cacheClient = getClient();

    let streamerHeader = await getStreamerHeaderById(channelID);

    let bodyData = {
        broadcaster_id: channelID,
        title: title,
        choices: choices,
        duration: Number(duration),
    }
    
    let response = await fetch(getTwitchHelixUrl('polls'), {
        method: 'POST',
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

    if(cache) {
        await cacheClient.set(`${pollData.channel}:poll`, JSON.stringify(pollData));
    }

    return pollData;
    
}

module.exports = createPoll;