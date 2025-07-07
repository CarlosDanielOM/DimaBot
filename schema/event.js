const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    version: {
        type: String,
        required: true,
        default: '1'
    },
    condition: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    icon: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        required: true,
        trim: true
    },
    textColor: {
        type: String,
        required: true,
        trim: true
    },
    releaseStage: {
        type: String,
        enum: ['stable', 'beta', 'alpha', 'maintenance', 'coming_soon', 'unavailable', 'deprecated'],
        default: 'stable'
    },
    enabled: {
        type: Boolean,
        default: false
    },
    premium: {
        type: Boolean,
        default: false
    },
    premium_plus: {
        type: Boolean,
        default: false
    },
    description: {
        EN: {
            type: String,
            required: true,
            trim: true
        },
        ES: {
            type: String,
            required: true,
            trim: true
        }
    },
    config: [{
        id: {
            type: String,
            required: true,
            trim: true
        },
        label: {
            EN: {
                type: String,
                required: true,
                trim: true
            },
            ES: {
                type: String,
                required: true,
                trim: true
            }
        },
        type: {
            type: String,
            required: true,
            enum: ['text', 'number', 'checkbox', 'select', 'message-tiers'],
            default: 'text'
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        canDisable: {
            type: Boolean,
            default: false
        }
    }],
    tierLimits: {
        basic: {
            type: Number,
            default: 0
        },
        premium: {
            type: Number,
            default: 2
        },
        premium_plus: {
            type: Number,
            default: 5
        }
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

// Update the updatedAt field before saving
eventSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Event', eventSchema); 