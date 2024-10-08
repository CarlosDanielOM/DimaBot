const createClip = require("../function/clip/create");
const getClip = require("../function/clip/getclip");

async function createChannelClip(channelID) {
    let createClipFun = await createClip(channelID);

    if(createClipFun.error) {
        return createClipFun;
    }

    let clipData = await checkClipStatus(channelID, createClipFun.clipID);

    if(clipData.status === 404) {
        return {
            error: true,
            message: 'There was an error creating the clip.',
            status: 404,
            type: 'Clip not found'
        }
    }

    if(!clipData.data) {
        return {
            error: true,
            message: 'There was an error creating the clip.',
            status: 404,
            type: 'Clip not found'
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
        if(getClipFun.status === 404 && retries < 8) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            return checkClipStatus(channelID, clipID, retries + 1); // Retry
        }
        return getClipFun;
    }

    return getClipFun;
}