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
    
    return app;
}

module.exports = server;