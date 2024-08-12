const CHANNEL = require('../function/channel');
const { getClient } = require('../util/database/dragonfly');
const titleConfigSchema = require('../schema/titleconfig');

async function title(channelID, title, userLevel = 1, commandLevel = 7, premium = 'false') {
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

    if(premium == 'true') {
        let titleConfig = await titleConfigSchema.findOne({ channelID: channelID });
        if(titleConfig) {
            let pretitle = titleConfig.pretitle;
            let posttitle = titleConfig.posttitle;
            title = `${pretitle} ${title} ${posttitle}`;
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