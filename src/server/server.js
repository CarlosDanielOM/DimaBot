require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const { getIO } = require('./websocket');

async function server() {
    let app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(express.static(`${__dirname}/routes/public`));
    app.use(cors());

    app.use('/dev', require('./routes/dev.routes'));
    app.use('/eventsubs', require('./routes/eventsub.routes'));
    app.use('/rewards', require('./routes/reward.routes'));
    app.use('/triggers', require('./routes/trigger.routes'));
    app.use('/clip', require('./routes/clip.routes'));
    app.use('/video', require('./routes/video.routes'));
    app.use('/speech', require('./routes/speach.routes'));
    app.use('/auth', require('./routes/auth.routes'));
    app.use('/twitch', require('./routes/twitch.routes'));
    app.use('/overlays', require('./routes/overlay.routes'));
    app.use('/sumimetro', require('./routes/sumimetro.routes'));
    app.use('/user', require('./routes/user.routes'));

    app.get('/media/:channelID/:triggerName', (req, res) => {
        const channelID = req.params.channelID;
        const triggerName = req.params.triggerName;
        if(!fs.existsSync(`${__dirname}/routes/public/uploads/triggers/${channelID}/${triggerName}`)) {
            return res.status(404).send({
                error: 'File not found',
                message: `The file ${triggerName} does not exist in the ${channelID} channel`
            });
        }
        res.status(200).sendFile(`${__dirname}/routes/public/uploads/triggers/${channelID}/${triggerName}`);
    });

    return app;
}

module.exports = server;