const speach = require('../function/speach');

const linkRegex = new RegExp(/((http|https):\/\/)?(www\.)?[a-zA-Z-]+(\.[a-zA-Z-]{2})+(:\d+)?(\/\S*)?(\?\S+)?/gi);

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

    let haslink = message.match(linkRegex);
    if(haslink) {
        message = message.replace(linkRegex, "[LINK]");
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

/*
const speach = require('../functions/speach')

const commandOptions = {
    name: 'Speach Chat',
    cmd: 's',
    func: 'speachChat',
    type: 'reserved',
    cooldown: 0,
    userLevelName: 'everyone',
    userLevel: 0,
    enabled: false,
    description: `Habla en el chat | Ejemplo: !s <mensaje> | Ejemplo: !s Hola como estas`,
    premium: false,
    readEmotes: false,
    premium_config: {
        auto_start: {
            enabled: false,
            games: []
        },
        auto_stop: {
            enabled: false,
            games: []
        }
    }
}

async function speachChat(tags, argument, channel) {
    let user = tags.username;
    let message = argument || undefined;

    if (message === undefined) return { error: 'No message provided.', reason: 'No se ha proporcionado ningún mensaje.', status: 400 };

    let emotesToReplace = [];

    if (tags.emotes && !commandOptions.readEmotes) {
        for (let emote in tags.emotes) {
            let emoteData = tags.emotes[emote];
            for (let i = 0; i < emoteData.length; i++) {
                let locations = emoteData[i].split('-');
                let start = parseInt(locations[0]) - 3;
                let end = parseInt(locations[1]);
                let emoteName = message.substring(start, end - 2);
                emotesToReplace.push(emoteName);
            }
        }
        for (let i = 0; i < emotesToReplace.length; i++) {
            message = message.replace(emotesToReplace[i], '');
        }
    }

    let msg = `${user} dice: ${message}`;

    //if (message.length > 100) return { error: 'Message too long.', reason: 'El mensaje es demasiado largo.', status: 400 };

    let response = await speach(tags.id, msg, channel);

    response.cooldown = commandOptions.cooldown;

    return response;
}

module.exports = speachChat
*/