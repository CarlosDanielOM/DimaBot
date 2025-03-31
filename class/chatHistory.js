const { getClient } = require('../util/database/dragonfly');

class ChatHistory {
    constructor() {
        this.cacheClient = null;
        this.maxHistorySize = 15; // Maximum history size for premium plus channels
    }

    async init() {
        try {
            this.cacheClient = getClient();
            if (!this.cacheClient) {
                throw new Error('Failed to initialize cache client');
            }
        } catch (error) {
            console.error('Error initializing ChatHistory:', error);
            throw error;
        }
    }

    async addMessage(channelID, username, message) {
        try {
            if (!this.cacheClient) {
                await this.init();
            }

            if (!channelID || !username || !message) {
                console.warn('Invalid message data:', { channelID, username, message });
                return;
            }

            const key = `${channelID}:chat:history`;
            const messageData = JSON.stringify({ username, message, timestamp: Date.now() });
            
            // Add new message
            await this.cacheClient.lpush(key, messageData);
            
            // Trim history to max size
            await this.cacheClient.ltrim(key, 0, this.maxHistorySize - 1);
        } catch (error) {
            console.error('Error adding message to chat history:', error);
            // Don't throw the error to prevent bot crashes
        }
    }

    async getRecentMessages(channelID, limit = 7) {
        try {
            if (!this.cacheClient) {
                await this.init();
            }

            if (!channelID) {
                console.warn('Invalid channelID for getRecentMessages');
                return [];
            }

            const key = `${channelID}:chat:history`;
            const messages = await this.cacheClient.lrange(key, 0, limit - 1);
            
            return messages.map(msg => JSON.parse(msg));
        } catch (error) {
            console.error('Error getting recent messages:', error);
            return [];
        }
    }

    async clearHistory(channelID) {
        try {
            if (!this.cacheClient) {
                await this.init();
            }

            if (!channelID) {
                console.warn('Invalid channelID for clearHistory');
                return;
            }

            const key = `${channelID}:chat:history`;
            await this.cacheClient.del(key);
        } catch (error) {
            console.error('Error clearing chat history:', error);
            // Don't throw the error to prevent bot crashes
        }
    }
}

module.exports = new ChatHistory(); 