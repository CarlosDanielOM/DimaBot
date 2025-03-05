const express = require('express');
const router = express.Router();
const fs = require('fs');
const { getIO } = require('../websocket');
const fetch = require('node-fetch');
const logger = require('../../../util/logger');
const { exec } = require('node:child_process');

const HTMLPATH = `${__dirname}/public`;
const DOWNLOADPATH = `${__dirname}/public/downloads`;

let soSent = [];

router.get('/:channelID', (req, res) => {
    res.status(200).sendFile(`${HTMLPATH}/clip.html`);
});

router.post('/:channelID', async (req, res) => {
    let io = getIO();
    let channelID = req.params.channelID;
    const { duration, clipUrl, title, game, streamer, profileImg, streamerColor, description } = req.body;
    let body = req.body;
    
    if(soSent.includes(channelID)) {
        return res.status(400).json({
            error: true,
            message: 'The channel has already sent a clip.',
            status: 400,
            type: 'error'
        });
    }

    if(!clipUrl) {
        return res.status(400).json({
            error: true,
            message: 'The clipUrl is required.',
            status: 400,
            type: 'error'
        });
    }

    // let clip = getVideoURL(thumbnail);
    let clip = await downloadClip(clipUrl, channelID);
    console.log(clip);

    if(!clip) {
        logger({error: true, message: 'The clipUrl is invalid.', status: 400, type: 'error', channelID, clipUrl}, true, channelID, 'clip invalid');
        return res.status(400).json({
            error: true,
            message: 'The clipUrl is invalid.',
            status: 400,
            type: 'error'
        });
    }

    logger({error: false, message: 'Clip sent', status: 200, type: 'success', channelID, clipUrl}, true, channelID, 'clip sent');

    io.of(`/clip/${channelID}`).emit('play-clip', body);
    soSent.push(channelID);
    setTimeout(() => {
        soSent = soSent.filter(id => id !== channelID);
    }, 1000 * Number(duration));
    
    res.status(200).json({
        error: false,
        message: 'The clip has been sent successfully. To: ' + channelID,
        status: 200,
        type: 'success'
    });
});

module.exports = router;

async function downloadClip(url, channelID) {
    return new Promise((resolve, reject) => {
        exec(`twitch-dl download -q 480p -o ${DOWNLOADPATH}/${channelID}-clip.mp4 ${url}`, (error, stdout, stderr) => {
            if(error) {
                console.log(error);
                return reject(error);
            }
            if(stderr) {
                console.log(stderr);
                return reject(stderr);
            }
            resolve(true);
        });
    });
}

function getVideoURL(thumbnail) {
    if(!thumbnail) return null;
    let firstPart = `${thumbnail.split('tv/')[0]}tv/`;

    let secondPart = thumbnail.split('tv/')[1];

    if(!secondPart) return null;

    let clipID = secondPart.split('-preview')[0];
    let extension = secondPart.split('.')[1];

    if(extension == 'jpg' || extension == 'jpeg' || extension == 'png') {
        extension = 'mp4';
    }

    return `${firstPart}${clipID}.${extension}`;
}