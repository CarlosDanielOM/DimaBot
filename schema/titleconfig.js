const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const titleConfig = new Schema({
    channelID: {type: String, required: true},
    channel: {type: String, required: true},
    pretitle: {type: String},
    posttitle: {type: String},
    active: {type: Boolean, default: true},
});

module.exports = mongoose.model('titleConfig', titleConfig);