const express = require('express');
const router = express.Router();
const STREAMERS = require('../../../class/streamer');

const commandSchema = require('../../../schema/command');

const auth = require('../../../middleware/auth');

router.use(auth);

router.post('/channelID', async (req, res) => {
    const { channelID } = req.params;
    let body = req.body;

    let newCommand = new commandSchema({
        name: body.name,
        cmd: body.cmd,
        func: body.func,
        message: body.message,
        responses: body.responses,
        type: body.type,
        reserved: body.reserved,
        description: body.description,
        cooldown: body.cooldown,
        userLevelName: body.userLevelName,
        userLevel: body.userLevel,
        channelID: channelID,
        channel: body.channel,
    })
    
    try {
        await newCommand.save();
        res.send({
            message: 'Command created',
            command: newCommand
        });
    } catch (error) {
        res.status(500).send({
            message: 'Error creating command',
            error: error
        });
    }
});

module.exports = router;