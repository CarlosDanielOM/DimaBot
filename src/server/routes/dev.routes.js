const express = require('express');
const router = express.Router();

const commandSchema = require('../../../schema/command');
const eventsubSchema = require('../../../schema/eventsub');
const Channel = require('../../../schema/channel');

const STREAMERS = require('../../../class/streamer');
const JSONCOMMANDS = require('../../../config/reservedcommands.json');
const { getUrl } = require('../../../util/dev');
const { getEventsubs } = require('../../../util/eventsub');

router.get('/eventsubs', async(req, res) => {
    const eventsubs = await getEventsubs();
    res.send(eventsubs);
});

router.post('/update/channels', async(req, res) => {
    try {
        // First, update channels that don't have chat_enabled field
        const result1 = await Channel.updateMany(
            { chat_enabled: { $exists: false } },
            [{ $set: { chat_enabled: "$actived" } }]
        );

        // Then, update all channels to match their actived status
        const result2 = await Channel.updateMany(
            {},
            [{ $set: { chat_enabled: "$actived" } }]
        );

        res.send(`Updated ${result1.modifiedCount} new channels and synchronized ${result2.modifiedCount} existing channels with actived status`);
    } catch (error) {
        res.status(500).send(`Error updating channels: ${error.message}`);
    }
});

router.post('/create/commands', async(req, res) => {
    const streamer = await STREAMERS.getStreamerNames();

    streamer.forEach(async streamer => {
        let result = await fetch(`${getUrl()}/dev/create/command/${streamer}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        });
    })

    res.send('Commands created');
});

router.post('/create/command/:streamer', async(req, res) => {
    const { streamer } = req.params;

    let channel = await STREAMERS.getStreamerByName(streamer);
    if(!channel) return res.status(404).send('Streamer not found');

    let commandsJSON = JSONCOMMANDS.commands;
    
    for (const command of commandsJSON) {
        let commandExists = await commandSchema.exists({channelID: channel.user_id, name: JSONCOMMANDS[command].name})

        if(commandExists) continue;

        let newCommand = new commandSchema({
            name: JSONCOMMANDS[command].name,
            cmd: JSONCOMMANDS[command].cmd,
            func: JSONCOMMANDS[command].func,
            type: JSONCOMMANDS[command].type,
            channel: channel.name,
            channelID: channel.user_id,
            cooldown: JSONCOMMANDS[command].cooldown,
            enabled: JSONCOMMANDS[command].enabled,
            userLevel: JSONCOMMANDS[command].userLevel,
            userLevelName: JSONCOMMANDS[command].userLevelName,
            reserved: JSONCOMMANDS[command].reserved,
        })

        await newCommand.save();
        
    }

    res.send('Commands created');

});

module.exports = router;