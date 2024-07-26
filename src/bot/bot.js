require('dotenv').config();

const CLIENT = require('../../util/client');
const STREAMERS = require('../../class/streamer');
const {connectChannels, refreshAllTokens} = require('../../util/dev')
const token = require('../../util/token');
const addModerator = require('../../command/addmoderator');
const ruletarusa = require('../../command/ruletarusa');
const shoutout = require('../../command/shoutout');
const speachChat = require('../../command/speach');

let client = null;

async function init() {
    client = CLIENT.getClient();

    await connectChannels(CLIENT.connectChannels, client);

    await refreshAllTokens(token.refreshAllTokens)

    console.log(await speachChat('533538623', {username: 'sleeples_panda', id: Math.random() * 999999999}, 'Hola'));
}

module.exports = init;