const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const eventsubSchema = require('../../../schema/eventsub');

const STREAMERS = require('../../../class/streamer');

const {subscribeTwitchEvent, unsubscribeTwitchEvent} = require('../../../util/eventsub');

router.get('/:channelID', async (req, res) => {
    let channelID = req.params.channelID;

    let query = req.query;
    let type = query.type;
    let id = query.id;

    if (!type || !id) {
        
    }

    let eventsub = await eventsubSchema.find({channelID: channelID});

    if (!eventsub) {
        return res.status(404).send('Eventsub not found');
    }

    return res.status(200).send({
        eventsub,
        total: eventsub.length
    });
});

router.get('/:channelID/:type', async (req, res) => {
    let channelID = req.params.channelID;
    let type = req.params.type;

    let eventsub = await eventsubSchema.find({channelID: channelID, type: type});

    if (!eventsub) {
        return res.status(404).send('Eventsub not found');
    }

    return res.status(200).send({
        eventsub,
        total: eventsub.length
    });
});

module.exports = router;