const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('User');
});

router.get('/:channelID', (req, res) => {});

module.exports = router;

/*
  app.post('/premium', async (req, res) => {
    let { channel, channelID } = req.body;

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

  app.get('/active/:channel', async (req, res) => {
    const { channel } = req.params;
    let exists = await channelSchema.findOne({ name: channel });

    if (!exists) return res.status(404).json({ message: 'Channel not found', error: true });

    if (exists.actived) {
      res.status(200).json({ message: 'Channel is active', active: true, error: false });
    } else {
      res.status(200).json({ message: 'Channel is not active', active: false, error: false });
    }

  })
*/