const express = require('express');
const router = express.Router();
const fs = require('fs');
const { getIO } = require('../websocket');
const fetch = require('node-fetch');

const HTMLPATH = `${__dirname}/public`;
const DOWNLOADPATH = `${__dirname}/public/downloads`;

let soSent = [];

router.get('/:channelID', (req, res) => {
    res.status(200).sendFile(`${HTMLPATH}/clip.html`);
});

router.post('/:channelID', async (req, res) => {
    let io = getIO();
    let channelID = req.params.channelID;
    const { duration, thumbnail, title, game, streamer, profileImg, streamerColor, description } = req.body;
    let body = req.body;
    
    if(soSent.includes(channelID)) {
        return res.status(400).json({
            error: true,
            message: 'The channel has already sent a clip.',
            status: 400,
            type: 'error'
        });
    }

    let clip = getVideoURL(thumbnail);

    let fileName = `${channelID}-clip.mp4`;

    let path = `${DOWNLOADPATH}/${fileName}`;

    if(!fs.existsSync(DOWNLOADPATH)) {
        fs.mkdirSync(DOWNLOADPATH, { recursive: true });
    }

    const response = await fetch(clip);
    if(!response.ok) {
        return res.status(400).json({
            error: true,
            message: 'The clip could not be downloaded.',
            status: 400,
            type: 'error'
        });
    }
    const file = fs.createWriteStream(path);
    const stream = response.body.pipe(file);

    await new Promise((resolve, reject) => {
        stream.on('finish', () => {
            io.of(`/clip/${channelID}`).emit('play-clip', body);
            soSent.push(channelID);
            setTimeout(() => {
                soSent = soSent.filter(id => id !== channelID);
            }, 1000 * Number(duration));
            resolve();
        });
    });
    
    file.on('error', (error) => {
        console.log(error);
        return res.status(400).json({
            error: true,
            message: 'The clip could not be downloaded.',
            status: 400,
            type: 'error'
        });
    });
    
    res.status(200).json({
        error: false,
        message: 'The clip has been sent successfully. To: ' + channelID,
        status: 200,
        type: 'success'
    });
});

module.exports = router;

function getVideoURL(thumbnail) {
    let firstPart = `${thumbnail.split('tv/')[0]}tv/`

    let secondPart = thumbnail.split('tv/')[1];

    let clipID = secondPart.split('-preview')[0];
    let extension = secondPart.split('.')[1];

    if(extension == 'jpg' || extension == 'jpeg' || extension == 'png') {
        extension = 'mp4';
    }

    return `${firstPart}${clipID}.${extension}`;
}