const { liveChannels } = require("../function/channel/islive");
const Channel = require("../schema/channel");
const { getClient } = require("./database/dragonfly");


async function startSiteAnalytics() {
    const cacheClient = getClient();

    if((await cacheClient.exists('site:analytics:start'))) {
        return true;
    }

    try {
        let channels = await Channel.find().select('twitch_user_id actived');
    
        let channelsCount = 0;
        let activeChannelsCount = 0;
        let liveChannelsCount = 0;
        for(let i = 0; i < channels.length; i++) {
            if(channels[i].actived) {
                activeChannelsCount++;
            }
            channelsCount++;
        }

        let onlineChannels = await liveChannels();
        if(onlineChannels.error) {
            console.error('Error getting online channels: ', onlineChannels.message);
            liveChannelsCount = 0;
        } else {
            liveChannelsCount = onlineChannels.data.length;
        }
        
        await cacheClient.hset('site:analytics:channels', 'registered', channelsCount);
        await cacheClient.hset('site:analytics:channels', 'live', liveChannelsCount);
        await cacheClient.hset('site:analytics:channels', 'active', activeChannelsCount);
        
        await cacheClient.set('site:analytics:start', 1);
        return true;
    } catch (error) {
        console.error('Error starting site analytics: ', error);
        return false;
    }
}

async function getSiteAnalytics(filter = null) {
    const cacheClient = getClient();
    if(filter) {
        return await cacheClient.hget('site:analytics:channels', filter);
    }
    return await cacheClient.hgetall('site:analytics:channels');
}

async function incrementSiteAnalytics(filter, value = 1) {
    const cacheClient = getClient();
    await cacheClient.hincrby('site:analytics:channels', filter, value);
    
    console.log(`Incrementing ${filter} by ${value}`);
}

async function decrementSiteAnalytics(filter, value = 1) {
    const cacheClient = getClient();
    await cacheClient.hincrby('site:analytics:channels', filter, -value);

    console.log(`Decrementing ${filter} by ${value}`);
}

module.exports = {
    startSiteAnalytics,
    getSiteAnalytics,
    incrementSiteAnalytics,
    decrementSiteAnalytics
}