require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const gtts = require('gtts');
const md = require('mp3-duration');

async function server() {
    let app = express();
    app.use(cors());

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use('/eventsubs', require('./routes/eventsub.routes'));
    app.use('/rewards', require('./routes/reward.routes'));
    app.use('/triggers', require('./routes/trigger.routes'));
    app.use('/clip', require('./routes/clip.routes'));
    app.use('/video', require('./routes/video.routes'));
    app.use('/speach', require('./routes/speach.routes'));
    
    return app;
}

module.exports = server;