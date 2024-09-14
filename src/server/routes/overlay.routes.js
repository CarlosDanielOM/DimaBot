const express = require('express');
const { getIO } = require('../websocket');
const router = express.Router();

const htmlPath = `${__dirname}/public`

router.get('/triggers/:channel', (req, res) => {
    res.sendFile(`${htmlPath}/trigger.html`);
});

router.get('/furry/:channel', (req, res) => {
    res.sendFile(`${htmlPath}/furry.html`);
});

router.post('/furry/:channel', (req, res) => {
    const { channel } = req.params;
    const { username, value } = req.body;

    if (!username || !value) {
        return res.status(400).json({ error: 'Username and value are required' });
    }

    let io = getIO();

    io.of(`/overlays/furry/${channel}`).emit('furry', { username, value });
    res.status(200).json({ message: 'Furry event triggered' });
});

module.exports = router;