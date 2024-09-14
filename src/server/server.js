require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');

async function server() {
    let app = express();
    app.use(cors());

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
    app.use('/speach', require('./routes/speach.routes'));
    app.use('/auth', require('./routes/auth.routes'));
    app.use('/twitch', require('./routes/twitch.routes'));
    app.use('/overlays', require('./routes/overlay.routes'));
    app.use('/sumimetro', require('./routes/sumimetro.routes'));

    return app;
}

module.exports = server;