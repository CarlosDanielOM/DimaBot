require('dotenv').config();

const CLIENT = require('../../util/client');
const STREAMERS = require('../../class/streamer');
const {connectChannels, refreshAllTokens} = require('../../util/dev')
const token = require('../../util/token');

let client = null;

async function init() {
    client = CLIENT.getClient();

    await connectChannels(CLIENT.connectChannels, client);

    await refreshAllTokens(token.refreshAllTokens)
    
}

module.exports = init;