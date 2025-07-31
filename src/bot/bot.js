require('dotenv').config();

const CLIENT = require('../../util/client');
const STREAMERS = require('../../class/streamer');
const {connectChannels, refreshAllTokens} = require('../../util/dev')
const token = require('../../util/token');
const messageHandler = require('../../handler/message');

let client = null;

async function init() {
    client = CLIENT.getClient();

    await connectChannels(CLIENT.connectChannels, client);

    // await refreshAllTokens(token.refreshAllTokens)

    client.on('resub', (channel, username, months, message, userstate, methods) => {
        if(channel == '#ozbellvt') return;
        let tier = userstate['msg-param-sub-plan'];
        switch (tier) {
            case 'Prime':
                tier = 'Prime';
                break;
            case '1000':
                tier = '1';
                break;
            case '2000':
                tier = '2';
                break;
            case '3000':
                tier = '3';
                break;
        }

        if (months == 0) { months++ }

        client.say(channel, `Gracias por la resub ${username}! de ${months} meses y de nivel ${tier}!`);
    });

    client.on('subscription', (channel, username, method, message, userstate) => {
        if(channel == '#ozbellvt') return;
        let tier = userstate['msg-param-sub-plan'];
        switch (tier) {
            case 'Prime':
                tier = 'Prime';
                break;
            case '1000':
                tier = '1';
                break;
            case '2000':
                tier = '2';
                break;
            case '3000':
                tier = '3';
                break;
        }

        client.say(channel, `Gracias por la sub ${username} de nivel ${tier}!`);
    })

    client.on('message', async (channel, tags, message, self) => {
        if(self) return;
        await messageHandler(client, channel.replace('#', ''), tags, message);
    })
}

module.exports = init;