const express = require('express');
const router = express.Router();
const fs = require('fs');
const { getIO } = require('../websocket');
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

    try {
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
    } catch (error) {
        logger({error: true, message: 'Something went wrong on our end.', status: 500, type: 'error', channelID, clipUrl}, true, channelID, 'clip error');
        return res.status(500).json({
            error: true,
            message: 'Something went wrong on our end.',
            status: 500,
            type: 'error'
        });
    }
});

module.exports = router;

async function downloadClip(url, channelID) {
    return new Promise((resolve, reject) => {
        console.log(`Downloading clip from ${url} for ${channelID}`);

        const downloadProcess = exec(`twitch-dl download -q 480p -o ${DOWNLOADPATH}/${channelID}-clip.mp4 ${url}`);

        const timeout = setTimeout(() => {
            console.log(`Timeout for ${channelID}`);
            downloadProcess.kill();
            reject(new Error('Download timeout'));
        }, 10000);

        downloadProcess.on('exit', (code) => {
            console.log(`Exit code for ${channelID}: ${code}`);
            clearTimeout(timeout);
            if(code === 0) {
                console.log(`Clip downloaded for ${channelID}`);
                resolve(true);
            } else {
                console.log(`Clip download failed for ${channelID}`);
                reject(new Error('Clip download failed'));
            }
        });

        downloadProcess.on('error', (err) => {
            console.log(`Error for ${channelID}: ${err}`);
            clearTimeout(timeout);
            reject(new Error('Clip download failed'));
        });
    });
}