require('dotenv').config();
const DragonFlyDB = require('../../util/database/dragonfly');
const MongDB = require('../../util/database/mongodb')
const CLIENT = require('../../util/client');
const eventsub = require('./eventsub')
const STREAMERS = require('../../class/streamer');
const bot = require('./bot');
const dev = require('../../util/dev');
const {refreshAllTokens, getNewAppToken} = require('../../util/token');
const chatHistory = require('../../class/chatHistory');

async function init() {
    try {
        await CLIENT.clientConnect();
    
        await DragonFlyDB.init();
        await MongDB.init();
        await STREAMERS.init();
        await chatHistory.init();

        eventsub.init();
        await bot();

        await dev.refreshAllTokens(refreshAllTokens);
    } catch (error) {
        console.error('Error on bot init: ', error);
    }
    
}

init()

setInterval(async () => {
    await dev.refreshAllTokens(refreshAllTokens);
    console.log('Refreshed all tokens');
}, 1000 * 60 * 60 * 3);

setInterval(async () => {
    await getNewAppToken();
    console.log('Refreshed app token');
}, 1000 * 60 * 60 * 24);