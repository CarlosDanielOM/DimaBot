const express = require('express');
const router = express.Router();

const STREAMERS = require('../../../class/streamer');

const auth = require('../../../middleware/auth');
const { getClient } = require('../../../util/database/dragonfly')

const adminSchema = require('../../../schema/admin');

router.use(auth);


router.get('/', async (req, res) => {
    const cacheClient = getClient();
});

router.post('/:channelID', async (req, res) => {
    const cacheClient = getClient();
    const { channelID } = req.params;

    let body = req.body;

    let streamer = await STREAMERS.getStreamerById(channelID);
    if (streamer.error) {
        return res.status(404).send({
            error: 'Streamer not found',
            message: 'Streamer not found',
            status: 404
        });
    }
    
});

module.exports = router;