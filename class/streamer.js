const channelSchema = require('../schema/channel');
const {decrypt} = require('../util/crypto');

const {getClient} = require('../util/database/dragonfly');

class STREAMERS {
    constructor() {
        this.cache = getClient();
    }

    async init() {
        this.cache = getClient();
        await this.getStreamersFromDB();
        console.log('Streamers loaded to cache')
    }

    async getStreamersFromDB() {
        try {
            this.cache = getClient();
            const result = await channelSchema.find({actived: true}, 'name twitch_user_id twitch_user_token twitch_user_refresh_token actived premium premium_plus refreshedAt chat_enabled');

            for(let i = 0; i < result.length; i++) {
                let data = {
                    name: result[i].name,
                    user_id: result[i].twitch_user_id,
                    token: decrypt(result[i].twitch_user_token),
                    refresh_token: decrypt(result[i].twitch_user_refresh_token),
                    actived: result[i].actived ? 'true' : 'false',
                    premium: result[i].premium ? 'true' : 'false',
                    premium_plus: result[i].premium_plus ? 'true' : 'false',
                    chat_enabled: result[i].chat_enabled ? 'true' : 'false'
                }
                
                // Store the data with both name and ID as keys
                await this.cache.hset(`${result[i].name}:streamer:data`, data);
                await this.cache.hset(`${result[i].twitch_user_id}:streamer:data`, data);
                
                // Add to index sets for quick lookups
                await this.cache.sadd('streamers:by:name', result[i].name);
                await this.cache.sadd('streamers:by:id', result[i].twitch_user_id);
            }
            
        } catch (error) {
            console.error(`Error getting streamers from DB: ${error}`);
        }
    }

    async getStreamerFromDBByName(name) {
        try {
            this.cache = getClient();
            const streamer = await channelSchema.findOne({name: name}, 'name twitch_user_id twitch_user_token twitch_user_refresh_token actived premium premium_plus refreshedAt chat_enabled');

            if (streamer) {
                let data = {
                    name: streamer.name,
                    user_id: streamer.twitch_user_id,
                    token: decrypt(streamer.twitch_user_token),
                    refresh_token: decrypt(streamer.twitch_user_refresh_token),
                    actived: streamer.actived ? 'true' : 'false',
                    premium: streamer.premium ? 'true' : 'false',
                    premium_plus: streamer.premium_plus ? 'true' : 'false',
                    chat_enabled: streamer.chat_enabled ? 'true' : 'false'
                }

                // Store the data with both name and ID as keys
                await this.cache.hset(`${streamer.name}:streamer:data`, data);
                await this.cache.hset(`${streamer.twitch_user_id}:streamer:data`, data);
                
                // Add to index sets for quick lookups
                await this.cache.sadd('streamers:by:name', streamer.name);
                await this.cache.sadd('streamers:by:id', streamer.twitch_user_id);
            }
        } catch (error) {
            console.error(`Error getting streamer ${name} from DB: ${error}`);
        }
    }

    async getStreamerFromDBById(id) {
        try {
            this.cache = getClient();
            const streamer = await channelSchema.findOne({twitch_user_id: id}, 'name twitch_user_id twitch_user_token twitch_user_refresh_token actived premium premium_plus refreshedAt chat_enabled');

            if (streamer) {
                let data = {
                    name: streamer.name,
                    user_id: streamer.twitch_user_id,
                    token: decrypt(streamer.twitch_user_token),
                    refresh_token: decrypt(streamer.twitch_user_refresh_token),
                    actived: streamer.actived ? 'true' : 'false',
                    premium: streamer.premium ? 'true' : 'false',
                    premium_plus: streamer.premium_plus ? 'true' : 'false',
                    chat_enabled: streamer.chat_enabled ? 'true' : 'false'
                }

                // Store the data with both name and ID as keys
                await this.cache.hset(`${streamer.name}:streamer:data`, data);
                await this.cache.hset(`${streamer.twitch_user_id}:streamer:data`, data);
                
                // Add to index sets for quick lookups
                await this.cache.sadd('streamers:by:name', streamer.name);
                await this.cache.sadd('streamers:by:id', streamer.twitch_user_id);
            }
        } catch (error) {
            console.error(`Error getting streamer ${id} from DB: ${error}`);
        }
    }

    async getStreamers() {
        const keys = await this.cache.keys('*:streamer:data');
        let streamers = [];

        for (const key of keys) {
            streamers.push(await this.cache.hgetall(key));
        }

        return streamers;
    }

    async getStreamerByName(name) {
        return this.cache.hgetall(`${name}:streamer:data`);
    }

    async getStreamerById(id) {
        return this.cache.hgetall(`${id}:streamer:data`);
    }

    async setStreamer(streamer) {
        try {
            await this.cache.hset(`${streamer.name}:streamer:data`, streamer);
        } catch (error) {
            console.error(`Error setting streamer ${streamer.name}: ${error}`);
        }
    }

    async deleteStreamerByName(name) {
        try {
            const streamer = await this.getStreamerByName(name);
            if (streamer) {
                // Remove from both name and ID indexes
                await this.cache.srem('streamers:by:name', name);
                await this.cache.srem('streamers:by:id', streamer.user_id);
                
                // Delete both name and ID data entries
                await this.cache.del(`${name}:streamer:data`);
                await this.cache.del(`${streamer.user_id}:streamer:data`);
            }
        } catch (error) {
            console.error(`Error deleting streamer ${name}: ${error}`);
        }
    }

    async deleteStreamerById(id) {
        try {
            const streamer = await this.getStreamerById(id);
            if (streamer) {
                // Remove from both name and ID indexes
                await this.cache.srem('streamers:by:name', streamer.name);
                await this.cache.srem('streamers:by:id', id);
                
                // Delete both name and ID data entries
                await this.cache.del(`${streamer.name}:streamer:data`);
                await this.cache.del(`${id}:streamer:data`);
            }
        } catch (error) {
            console.error(`Error deleting streamer ${id}: ${error}`);
        }
    }

    async getStreamerNames() {
        return await this.cache.smembers('streamers:by:name');
    }
    
    async updateStreamers() {
        try {
            await this.getStreamersFromDB();
            console.log('Streamers updated');
        } catch (error) {
            console.error(`Error updating streamers: ${error}`);
        }
    }

    async updateStreamerByName(name) {
        try {
            await this.getStreamerFromDBByName(name);
            console.log(`Streamer ${name} updated`);
        } catch (error) {
            console.error(`Error updating streamer ${name}: ${error}`);
        }
    }

    async updateStreamerById(id) {
        try {
            await this.getStreamerFromDBById(id);
            console.log(`Streamer ${id} updated`);
        } catch (error) {
            console.error(`Error updating streamer ${id}: ${error}`);
        }
    }
    
    async getStreamerTokenByName(name) {
        const streamer = await this.getStreamerByName(name);
        return streamer.token;
    }

    async getStreamerTokenById(id) {
        const streamer = await this.getStreamerById(id);
        return streamer.token;
    }

    async getStreamerRefreshTokenByName(name) {
        const streamer = await this.getStreamerByName(name);
        return streamer.refresh_token;
    }

    async getStreamerRefreshTokenById(id) {
        const streamer = await this.getStreamerById(id);
        return streamer.refresh_token;
    }
    
}

module.exports = new STREAMERS();