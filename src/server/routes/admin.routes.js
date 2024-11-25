const express = require('express');
const router = express.Router();

const STREAMERS = require('../../../class/streamer');
const { getUserByLogin } = require('../../../function/user/getuser');
const logger = require('../../../util/logger');

const auth = require('../../../middleware/auth');
const { getClient } = require('../../../util/database/dragonfly')

const adminSchema = require('../../../schema/admin');

router.use(auth);


router.get('/:channelID', async (req, res) => {
    const cacheClient = getClient();
    const { channelID } = req.params;
});

router.post('/:channelID', async (req, res) => {
    const cacheClient = getClient();
    const { channelID } = req.params;

    let body = req.body;

    let channelName = body.channelName;
    let adminName = body.adminName;

    if(!channelName || !adminName) {
        return res.status(400).json({
            error: true,
            message: "Missing parameters",
            status: 400
        });
    }

    let userData = await getUserByLogin(adminName);
    if (userData.error) {
        logger(userData, true, channelID, 'admin userData');
        res.status(userData.status).json(userData);
    }

    userData = userData.data;

    adminData = {
        channelID: channelID,
        channelName: channelName,
        adminID: userData.id,
        adminName: adminName
    }

    try {
        //TODO: Save admin to db
        await cacheClient.sadd(`${channelID}:admins`, adminName);
    } catch (error) {
        logger({error}, true, channelID, `admin-${channelID}-${adminName}`);
    }

    res.status(201).json({
        error: false,
        message: 'Admin added successfully',
        status: 201
    });
    
});

router.delete('/:channelID/:adminID', async (req, res) => {
    const cacheClient = getClient();
    const { channelID, adminID } = req.params;

    let exists = await cacheClient.exists(`${channelID}:admins:${adminID}`);

    if(exists == 0) {
        return res.status(404).json({
            error: true,
            message: "Admin not found",
            status: 404
        });
    }

    try {
        await adminSchema.findOneAndDelete({channelID, adminID});
        await cacheClient.del(`${channelID}:admins:${adminID}`);
    } catch (error) {
        logger({error: true, message: "Deleting document on DB went wrong"}, true, channelID, `admin-${channelID}-${adminID}-delete`);
    }
    
})

module.exports = router;