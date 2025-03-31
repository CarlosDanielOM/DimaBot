const { getClient } = require('../util/database/dragonfly');

class ChatHistory {
    constructor() {
        this.cacheClient = getClient();
        this.maxHistorySize = 15; // Maximum history size for premium plus channels
    }

    async addMessage(channelID, username, message) {
        const key = `${channelID}:chat:history`;
        const messageData = JSON.stringify({ username, message, timestamp: Date.now() });
        
        // Add new message
        await this.cacheClient.lpush(key, messageData);
        
        // Trim history to max size
        await this.cacheClient.ltrim(key, 0, this.maxHistorySize - 1);
    }

    async getRecentMessages(channelID, limit = 7) {
        const key = `${channelID}:chat:history`;
        const messages = await this.cacheClient.lrange(key, 0, limit - 1);
        
        return messages.map(msg => JSON.parse(msg));
    }

    async clearHistory(channelID) {
        const key = `${channelID}:chat:history`;
        await this.cacheClient.del(key);
    }
}

module.exports = new ChatHistory(); 