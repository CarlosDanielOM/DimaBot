const speach = require('../function/speach');

async function speachChat(channelID, tags, argument) {
    let user = tags.username;
    let message = argument || undefined;

    if(!message) {
        return {
            error: true,
            message: 'No message provided',
            status: 400,
            type: 'error',
            where: 'speach'
        }
    }

    let emotesToReplace = [];

    if(tags.emotes) {
        for (let emote in tags.emotes) {
            let emoteData = tags.emotes[emote];
            emoteData.forEach(emote => {
                let locations = emote.split('-');
                let start = parseInt(locations[0] - 3);
                let end = parseInt(locations[1]);
                let emoteName = message.substring(start, end - 2);
                emotesToReplace.push(emoteName);
            });
        }
        emotesToReplace.forEach(emote => {
            message = message.replace(emote, '');
        });
    }

    let msg = `${user} dice: ${message}`;

    let speachData = await speach(tags.id, msg, channelID);

    if(speachData.error) {
        return {
            error: true,
            message: speachData.message,
            status: speachData.status,
            type: speachData.type
        }
    }

    return {
        error: false,
        message: 'Speach sent',
        status: 200,
        type: 'success'
    }
    
}

module.exports = speachChat;