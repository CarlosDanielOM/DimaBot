const CHANNEL = require('../function/channel');
const { getClient } = require('../util/database/dragonfly');

async function title(channelID, title, userLevel = 1, commandLevel = 7) {
    let cacheClient = getClient();
    if(!title || userLevel < commandLevel) {
        let data = await CHANNEL.getInformation(channelID);
        if(data.error) {
            return data;
        }
        let title = data.data.title;

        return {
            error: false,
            message: `The title for this stream is: ${title}`,
            status: 200,
            type: 'success'
        }
    }

    let titleData = await CHANNEL.setInformation(channelID, { title: title });
    if(titleData.error) {
        return titleData;
    }

    return {
        error: false,
        message: `The title for this stream has been updated to: ${title}`,
        status: 200,
        type: 'success'
    }
    
}

module.exports = title;