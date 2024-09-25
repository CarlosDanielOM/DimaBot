const express = require('express');
const router = express.Router();

const gtts = require('gtts');
const md = require('mp3-duration');
const fs = require('fs');

const { getUrl } = require('../../../util/dev');
const { getIO } = require('../websocket');

let speachMap = new Map();

router.get('/:channelID', (req, res) => {
    res.status(200).sendFile(`${__dirname}/public/speach.html`);
});

router.get('/:channelID/:msgID', (req, res) => {
    const channelID = req.params.channelID;
    const msgID = req.params.msgID;

    res.status(200).sendFile(`${__dirname}/public/speach/${msgID}.mp3`);
});

router.post('/:channelID', (req, res) => {
    const channelID = req.params.channelID;
    const {speach, msgID} = req.body;
    const lang = req.body.lang || 'es';
    const tts = new gtts(speach, lang);

    let io = getIO();

    tts.save(`${__dirname}/public/speach/${msgID}.mp3`, (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).send({
                error: 'Error saving the file.',
                message: err,
                status: 500
            });
        }

        if(!speachMap.has(channelID)) {
            speachMap.set(channelID, []);
        }

        let channelMap = speachMap.get(channelID);
        if(channelMap.length === 0) {
            md(`${__dirname}/public/speach/${msgID}.mp3`, (err, duration) => {
                if(err) {
                    console.log(err);
                    return res.status(500).send({
                        error: 'Error getting the duration of the file.',
                        message: err,
                        status: 500
                    });
                }

                io.of(`/speach/${channelID}`).emit('speach', { id: msgID });
                setTimeout(() => {
                    fetch(`${getUrl()}/speach/send/${channelID}`, {
                        method: 'POST',
                        body: JSON.stringify({
                            id: msgID
                        })
                    });
                }, duration * 1000);                
            });
        }
        channelMap.push(msgID);
        speachMap.set(channelID, channelMap);
    });

    res.status(200).send({
        message: 'Speach saved',
        status: 200
    });
});

router.post('/send/:channelID', (req, res) => {
    const channelID = req.params.channelID;
    const { id } = req.body;
    
    let channelMap = speachMap.get(channelID);
    if(channelMap.length === 0) {
        return res.status(200).send({
            message: 'No speach to send',
            status: 200
        });
    }

    let newMsgID = channelMap.shift();
    speachMap.set(channelID, channelMap);

    md(`${__dirname}/public/speach/${newMsgID}.mp3`, (err, duration) => {
        if(err) {
            console.log(err);
            return res.status(500).send({
                error: 'Error getting the duration of the file.',
                message: err,
                status: 500
            });
        }

        io.of(`/speach/${channelID}`).emit('speach', { id: newMsgID });
        //? Removes the file from the folder
        setTimeout(() => {
            fs.unlinkSync(`${__dirname}/public/speach/${newMsgID}.mp3`);
        }, (duration * 1000) - 1000);
        
        //? Send the next speach
        setTimeout(() => {
            fetch(`${getUrl()}/speach/send/${channelID}`, {
                method: 'POST',
                body: JSON.stringify({
                    id: newMsgID
                })
            });
        }, duration * 1000);
    });
    
    res.status(200).send({
        message: `Playing speech on ${channelID}`,
        status: 200
    });
});

module.exports = router;