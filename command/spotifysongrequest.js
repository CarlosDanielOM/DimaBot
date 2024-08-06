const commandsSchema = require('../schema/command');
const STREAMERS = require('../class/streamer');

async function spotifySongRequest(channelID, argument, userLevel = 1) {
    if(!argument) return { error: true, message: 'no argument provided'};
    if(!channelID) return { error: true, message: 'no channel provided'};
    if(!userLevel) return { error: true, message: 'no user level provided'};

    let streamer = await STREAMERS.getStreamerById(channelID);


    let commandInfo = await commandsSchema.findOne({ func: 'spotifySongRequest', channelID: channelID });

    if(!commandInfo) return { error: true, message: 'command not found' };

    let permissions = commandInfo.permissions;

    let response = null;
    let data = null;
    switch(argument) {
        case 'play': 
            if(userLevel < permissions.play) return { error: true, message: 'user does not have permission' };
            response = await fetch(`https://spotify.domdimabot.com/song/play`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ channelID: channelID })
            });
            data = await response.json();
            if(data.error) return { error: true, message: data.message };
            return { error: false, message: 'Music playing' };
            break;
        case 'pause':
            if(userLevel < permissions.pause) return { error: true, message: 'user does not have permission' };
            response = await fetch(`https://spotify.domdimabot.com/song/pause`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ channelID: channelID })
            });
            data = await response.json();
            if(data.error) return { error: true, message: data.message };
            return { error: false, message: 'Music stoped' };
            break;
        case 'skip': 
            if(userLevel < permissions.skip) return { error: true, message: 'user does not have permission' };
            response = await fetch(`https://spotify.domdimabot.com/song/skip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ channelID: channelID })
            });
            data = await response.json();
            if(data.error) return { error: true, message: data.message };
            return { error: false, message: 'Song skipped' };
            break;
        default: 
            if(userLevel < commandInfo.userLevel) return { error: true, message: 'user does not have permission' };
            response = await fetch(`https://spotify.domdimabot.com/song/queue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ channelID: channelID, song: argument })
            });
            if(response.status !== 200) {
                return { error: true, message: '' };
            }
            data = await response.json();
            if(data.error) return { error: true, message: data.message };
            return { error: false, message: 'Song queued' };
            break;
    }
    
}

module.exports = spotifySongRequest;