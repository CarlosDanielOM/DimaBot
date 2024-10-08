require('dotenv').config();
const tmi = require('tmi.js');
const STREAMERS = require('../class/streamer');
const { getClientOpts } = require('./dev');

let client = null;

const options = getClientOpts();

async function clientConnect() {
    try {
        client = new tmi.client(options);
        await client.connect();

        client.on('connected', (address, port) => {
            console.log(`* Twitch CLient Connected to ${address}:${port}`);
        })
    } catch (error) {
        console.error('Error connecting to Twitch: ', error);
    }
}

function getClient() {
    return client;
}

async function connectChannels() {
    const joinableChannels = await STREAMERS.getStreamerNames();

    for (let i = 0; i < joinableChannels.length; i++) {
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
            await client.join(joinableChannels[i]);
        } catch (error) {
            console.error(`Error connecting to channel ${joinableChannels[i]}: ${error}`);
        }
    }
}

function connectChannel(channel) {
    let client = getClient();
    try {
        client.join(channel);
    } catch (error) {
        console.error(`Error connecting to channel ${channel}: ${error}`);
    }
}

function disconnectChannel(channel) {
    try {
        client.part(channel);
    } catch (error) {
        console.error(`Error disconnecting from channel ${channel}, error: ${error}`);
    }
}

module.exports = {
    clientConnect,
    getClient,
    connectChannels,
    connectChannel,
    disconnectChannel
}