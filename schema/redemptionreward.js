const mongoose = require('mongoose');

const schema = mongoose.Schema;

const redemptionRewardSchema = new schema({
    eventsubID: { type: String, required: true },
    channelID: { type: String, required: true },
    channel: { type: String, required: true },
    rewardID: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, default: 'custom' },
    prompt: { type: String, defualt: '' },
    originalCost: { type: Number, required: true },
    cost: { type: Number, required: true },
    isEnabled: { type: Boolean, defualt: true },
    message: { type: String, defualt: '' },
    costChange: { type: Number, defualt: 0 },
    returnToOriginalCost: { type: Boolean, defualt: false },
    duration: { type: Number, defualt: 0 },
    cooldown: { type: Number, defualt: 0 },
    backgroundColor: { type: String },
    createdFrom: { type: String, defualt: 'domdimabot' },
    createdFor: { type: String, defualt: 'twitch' },
});

module.exports = mongoose.model('redemptionreward', redemptionRewardSchema);