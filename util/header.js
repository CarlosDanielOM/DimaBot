require('dotenv').config();
const STREAMERS = require('../class/streamer');

let botHeader = {
    'Authorization': null,
    'Client-Id': process.env.CLIENT_ID,
    'Content-Type': 'application/json',
}

let streamerHeader = {
    'Authorization': null,
    'Client-Id': process.env.CLIENT_ID,
    'Content-Type': 'application/json',
}

let appHeader = {
    'Authorization': null,
    'Client-Id': process.env.CLIENT_ID,
    'Content-Type': 'application/json',
}

async function getStreamerHeaderByName(name) {
    let streamer = await STREAMERS.getStreamerByName(name);
    streamerHeader.Authorization = `Bearer ${streamer.token}`;
    return streamerHeader;
}

async function getBotHeader() {
    let bot = await STREAMERS.getStreamerByName('domdimabot');
    botHeader.Authorization = `Bearer ${bot.token}`;
    return botHeader;
}

async function getStreamerHeaderById(id) {
    let streamer = await STREAMERS.getStreamerById(id);
    streamerHeader.Authorization = `Bearer ${streamer.token}`;
    return streamerHeader;
}

module.exports = {
    getStreamerHeaderByName,
    getBotHeader,
    getStreamerHeaderById,
    appHeader
}