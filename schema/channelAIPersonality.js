const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const channelAIPersonalitySchema = new Schema({
    channelID: { type: String, required: true },
    channel: { type: String, required: true },
    personality: {
        type: String,
        required: true,
        default: "You are a friendly Twitch chat moderator who speaks in Spanish by default but can adapt to other languages. You have a good sense of humor and can be playful with chat users."
    },
    rules: [{
        type: String,
        required: true,
        default: "Be respectful and friendly with users"
    }],
    knownUsers: [{
        username: String,
        description: String,
        lastInteraction: Date,
        relationship: String // e.g., "friendly", "playful", "professional"
    }],
    contextWindow: {
        type: Number,
        required: true,
        default: 7 // Default for premium channels
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add validation for rules and knownUsers based on channel tier
channelAIPersonalitySchema.pre('save', async function(next) {
    const Channel = require('./channel');
    const channel = await Channel.findOne({ twitch_user_id: this.channelID });
    
    if (!channel) {
        throw new Error('Channel not found');
    }

    // Premium Plus channels have no limits
    if (channel.premium_plus) {
        this.contextWindow = 15;
        return next();
    }

    // Premium channels can have up to 5 rules and 10 known users
    if (channel.premium) {
        if (this.rules.length > 5) {
            throw new Error('Premium channels can only have up to 5 rules');
        }
        if (this.knownUsers.length > 10) {
            throw new Error('Premium channels can only have up to 10 known users');
        }
        this.contextWindow = 7; // Force context window to 3 for premium
    } else {
        // Free channels can have up to 3 rules and 5 known users
        if (this.rules.length > 3) {
            throw new Error('Free channels can only have up to 3 rules');
        }
        if (this.knownUsers.length > 3) {
            throw new Error('Free channels can only have up to 3 known users');
        }
        this.contextWindow = 3; // Force context window to 3 for free channels
    }

    next();
});

module.exports = mongoose.model('ChannelAIPersonality', channelAIPersonalitySchema); 