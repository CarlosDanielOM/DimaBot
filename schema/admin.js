const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const AdminSchema = new Schema({
    adminName: {
        type: String,
        default: ''
    },
    adminID: {
        type: String,
        default: ''
    },
    channelName: {
        type: String,
        default: ''
    },
    channelID: {
        type: String,
        default: ''
    },
    actived: {
        type: Boolean,
        default: true
    },
    permissions: {
        type: Array,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

AdminSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = Mongoose.model('Admin', AdminSchema);