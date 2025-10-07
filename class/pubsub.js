const { getClient } = require("../util/database/dragonfly");

class PubSubManager {
    constructor() {
        this.publisher = null;
        this.subscriber = null;
        this.subscriptions = new Map();
    }

    async init() {
        // Create separate connections for pub/sub
        this.publisher = getClient().duplicate();
        this.subscriber = getClient().duplicate();
        
        this.subscriber.on('message', this.handleMessage.bind(this));
        this.subscriber.on('error', (error) => {
            console.error('PubSub subscriber error:', error);
        });
        
        console.log('PubSub manager initialized');
    }

    async publish(channel, data) {
        if (!this.publisher) {
            await this.init();
        }
        
        const message = JSON.stringify({
            ...data,
            timestamp: Date.now()
        });
        
        await this.publisher.publish(channel, message);
    }

    async subscribe(channel, handler) {
        if (!this.subscriber) {
            await this.init();
        }
        
        await this.subscriber.subscribe(channel);
        this.subscriptions.set(channel, handler);
    }

    async unsubscribe(channel) {
        if (this.subscriber) {
            await this.subscriber.unsubscribe(channel);
            this.subscriptions.delete(channel);
        }
    }

    handleMessage(channel, message) {
        try {
            const data = JSON.parse(message);
            const handler = this.subscriptions.get(channel);
            
            if (handler) {
                handler(data);
            }
        } catch (error) {
            console.error('Error handling pub/sub message:', error);
        }
    }

    // Convenience methods for specific update types
    async publishWeeklyMessageUpdate(channelID, count) {
        await this.publish('bot:updates', {
            type: 'weekly_message_update',
            channelID,
            count
        });
    }
}

module.exports = new PubSubManager();