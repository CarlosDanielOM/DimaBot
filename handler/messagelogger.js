const PUBSUB = require("../class/pubsub");
const { getClient } = require("../util/database/dragonfly");

async function messageLogger(channelID, tags, message) {
    const cacheClient = getClient();

    let existsGlobal = await cacheClient.exists(`${channelID}:weekly:messages`);
    if(!existsGlobal) {
        await cacheClient.set(`${channelID}:weekly:messages`, 0);
        await cacheClient.expire(`${channelID}:weekly:messages`, generateTimeLeftToNextWeekInSeconds());
    }

    const newCount = await cacheClient.incr(`${channelID}:weekly:messages`);

    await PUBSUB.publishWeeklyMessageUpdate(channelID, newCount);
}

module.exports = messageLogger;

function generateTimeLeftToNextWeekInSeconds() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const timeLeft = 6 - dayOfWeek;

    const timeLeftInSeconds = timeLeft * 24 * 3600 - now.getHours() * 3600 - now.getMinutes() * 60 - now.getSeconds();

    return timeLeftInSeconds;
}