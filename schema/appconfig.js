const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appConfigSchema = new Schema({
    name: String,
    access_token: {
        iv: String,
        content: String
    },
    refreshed_at: { type: Date, default: Date.now }
});

appConfigSchema.pre('save', function(next) {
    this.refreshed_at = Date.now();
    next();
});

const AppConfig = mongoose.model('app_config', appConfigSchema);

module.exports = AppConfig;