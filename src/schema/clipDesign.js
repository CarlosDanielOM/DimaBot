const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clipDesignSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    channelID: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        required: true
    },
    cssUrl: {
        type: String,
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
clipDesignSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Ensure only one default design per channel
clipDesignSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { channelID: this.channelID, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

const ClipDesign = mongoose.model('ClipDesign', clipDesignSchema);

module.exports = ClipDesign; 