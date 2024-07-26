const CHAT = require('../chat');
const { searchGameById } = require('../search/game');
const { getUrl } = require('../../util/dev');

async function showClip(channelID, clipData, streamerData, streamerChannelData) {
    if(!clipData, !streamerData, !streamerChannelData) {
        console.log({error: true, message: "Missing parameters", status: 400, type: "missing_parameters", channelID})
        return {
            error: true,
            message: "Missing parameters",
            status: 400,
            type: "missing_parameters"
        }
    }

    let streamerID = streamerData.id;

    let streamerColor = await CHAT.getUserColor(streamerID);
    if(streamerColor.error) {
        console.log(streamerColor)
        return streamerColor;
    }

    let randomClipNumber = Math.floor(Math.random() * clipData.length);
    let randomClip = clipData[randomClipNumber];
    let duration = randomClip.duration;
    let thumbnail = randomClip.thumbnail_url;

    if (!duration || !thumbnail) {
        console.log({error: true, message: "Missing parameters", status: 400, type: "missing_parameters", channelID})
        return {
            error: true,
            message: "Missing parameters",
            status: 400,
            type: "missing_parameters"
        }
    }

    let clipGame = await searchGameById(randomClip.game_id);

    if(!clipGame) {
        console.log({error: true, message: "Game not found", status: 404, type: "game_not_found", channelID})
        return {
            error: true,
            message: "Game not found",
            status: 404,
            type: "game_not_found"
        }
    }

    let clipResponse = await fetch(`${getUrl()}/clip/${channelID}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            duration,
            thumbnail,
            title: streamerChannelData.title,
            game: clipGame.data.name,
            streamer: streamerData.display_name,
            profileImage: streamerData.profile_image_url,
            description: streamerData.description,
            streamerColor: streamerColor,
        })
    })
    
    let data = await clipResponse.json();

    if(data.error) {
        console.log(data)
        return data;
    }

    return data;
    
}

module.exports = showClip;