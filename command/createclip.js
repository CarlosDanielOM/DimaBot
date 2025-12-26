const createClip = require("../function/clip/create");
const getClip = require("../function/clip/getclip");

async function createChannelClip(channelID) {
    let createClipFun = await createClip(channelID);

    if(createClipFun.status === 503) {
        return {
            error: true,
            message: 'Clip creation is currently unavailable.',
            status: 503,
            type: 'Clip creation unavailable'
        }
    }

    if(createClipFun.status > 500) {
        return {
            error: true,
            message: 'There was an internal Twitch server error that we cannot resolve.',
            status: createClipFun.status,
            type: 'Clip creation error'
        };
    }

    if(createClipFun.error) {
        return createClipFun;
    }

    let clipData = await checkClipStatus(channelID, createClipFun.clipID);

    if(clipData.status === 404) {
        return {
            error: true,
            message: 'There was an error finding the clip, it may have been created but is taking too long to process. Please check your clips later.',
            status: 404,
            type: 'Clip not found'
        }
    }
    
    if(clipData.error) {
        return clipData;
    }

    if(!clipData.data) {
        return {
            error: true,
            message: 'There was an unexpected error retrieving the clip data.',
            status: 500,
            type: 'Clip data missing'
        }
    }

    return {
        error: false,
        message: `Clip created successfully: ${clipData.data.url}`,
        clipData: clipData.data,
        status: 200,
        type: 'Clip created'
    }
    
}

module.exports = createChannelClip;

async function checkClipStatus(channelID, clipID, retries = 0) {
    let getClipFun = await getClip(channelID, clipID);

    if(getClipFun.error) {
        if(getClipFun.status === 404 && retries < 15) { // Increased retries to 15 (total ~30s)
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            return checkClipStatus(channelID, clipID, retries + 1); // Retry
        }
        return getClipFun;
    }

    return getClipFun;
}