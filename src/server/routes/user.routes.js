const express = require('express');
const router = express.Router();
const channelSchema = require('../../../schema/channel');
const STREAMERS = require('../../../class/streamer');
const { getClient } = require('../../../util/database/dragonfly');

router.get('/', async (req, res) => {
    const cacheClient = getClient();
    let query = req.query;

    let username = query.username || null;

    if(!username) {
        return res.status(400).json({
            error: true,
            message: "Missing parameters",
            status: 400
        });
    }

    let userData = await getUserByLogin(username);
    if (userData.error) {
        return res.status(userData.status).json(userData);
    }

    userData = userData.data;

    let dataToSend = {
      username: userData.login,
      id: userData.id,
      display_name: userData.display_name,
      profile_image_url: userData.profile_image_url,
      offline_image_url: userData.offline_image_url,
    }

    return res.status(200).json({
        error: false,
        data: dataToSend,
        status: 200
    });
    
});

router.get('/:channelID', async (req, res) => {
  const { channelID } = req.params;

  let streamer = await STREAMERS.getStreamerById(channelID);

  if(!streamer) return res.status(404).json({ error: true, reason: 'Streamer not found' });

  delete streamer.refresh_token;

  return res.status(200).json({ error: false, streamer: streamer });
});

router.post('/premium', async (req, res) => {
    const { channel, channelID } = req.body;
    let exists = await channelSchema.findOne({ name: channel, twitch_user_id: channelID }, 'premium premium_plus');

    if (!exists) {
      res.status(400).json({ error: true, reason: 'Channel not found' });
      return false;
    }

    if (exists.premium_plus) {
        return res.status(200).json({ error: false, message: 'Channel is premium plus', premium: 'premium_plus' });
      } else if (exists.premium) {
        return res.status(200).json({ error: false, message: 'Channel is premium', premium: 'premium' });
      } else {
        return res.status(200).json({ error: false, message: 'Channel is not premium', premium: 'none' });
      }
});

router.get('/active/:channel', async (req, res) => {
  const { channel } = req.params;
  let exists = await channelSchema.findOne({ name: channel });

  if (!exists) return res.status(404).json({ message: 'Channel not found', error: true });

  if (exists.actived) {
    res.status(200).json({ message: 'Channel is active', active: true, error: false });
  } else {
    res.status(200).json({ message: 'Channel is not active', active: false, error: false });
  }
});

module.exports = router;