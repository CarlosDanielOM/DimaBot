const express = require('express');
const router = express.Router();


router.get('/:channelID', (req, res) => {
    const channelID = req.params.channelID;
    res.status(200).sendFile(`${__dirname}/routes/public/downloads/${channelID}-clip.mp4`);
});

module.exports = router;