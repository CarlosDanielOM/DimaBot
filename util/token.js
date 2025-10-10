require('dotenv').config();
const STREAMERS = require('../class/streamer');
const channelSchema = require('../schema/channel');
const appConfigSchema = require('../schema/appconfig');
const { decrypt, encrypt } = require('./crypto');
const CLIENT = require('./client');
const { getClient } = require('./database/dragonfly');
const { decrementSiteAnalytics } = require('./siteanalytics');

let count = 0;

async function refreshAllTokens() {
    count++;
    let cache = getClient();
    await STREAMERS.updateStreamers();
    const streamers = await STREAMERS.getStreamerNames();

    const promises = streamers.map(async streamer => {
    try {
            let channel = await STREAMERS.getStreamerByName(streamer);

            if(!channel) return;

            if(!channel.refresh_token) {
                console.log('Refresh token is null for ', {streamer});
            };
            
            const { tokenEncrypt, refreshTokenEncrypt } = await refreshToken(channel.refresh_token);

            if(!tokenEncrypt || !refreshTokenEncrypt) {
                CLIENT.disconnectChannel(streamer);
                let nullToken = {
                    iv: null,
                    content: null
                }
                let nullRefreshToken = {
                    iv: null,
                    content: null
                }
                await channelSchema.findOneAndUpdate({name: streamer}, {twitch_user_token: nullToken, twitch_user_refresh_token: nullRefreshToken, actived: false, chat_enabled: false, refreshedAt: Date.now()});

                decrementSiteAnalytics('active', 1);

                await cache.del(`${streamer}:streamer:data`);
                await cache.srem('streamers:by:name', streamer);
                await cache.srem('streamers:by:id', channel.user_id);

                return console.error(`Error refreshing token for ${streamer}, token is null, deactivating channel`);
            };

            channel.token = decrypt(tokenEncrypt);
            channel.refresh_token = decrypt(refreshTokenEncrypt);
            cache.hset(`${streamer}:streamer:data`, 'token', channel.token);
            cache.hset(`${streamer}:streamer:data`, 'refresh_token', channel.refresh_token);

            if(count != 5) {
                let doc = await channelSchema.findOneAndUpdate({name: streamer}, {twitch_user_token: tokenEncrypt, twitch_user_refresh_token: refreshTokenEncrypt, refreshedAt: Date.now()});

                if(doc.errors) {
                    console.error(`Error refreshing token for ${streamer} Doc Errors: ${doc.errors}`);
                }
            }
    }
    catch (error) {
        console.error(`Error refreshing token for ${streamer} Error: ${error}`);
    }
    
    if(count == 5) count = 0;

    });

    console.log('Refreshing all tokens');
    await Promise.all(promises);
    await STREAMERS.updateStreamers();
}

async function refreshToken(refresh_token, independent = false, user = null) {
    if(!user && independent) {
        console.log({refresh_token, independent, user});
        return {
        tokenEncrypt: null,
        refreshTokenEncrypt: null
    }}
    try {
        let cache = getClient();
        let params = new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        });

        let response = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        });

        response = await response.json();

        if(response.status === 400) {
            console.error(`Error refreshing token for ${user} HTTP Request: ${response.message}`);
            return {
                tokenEncrypt: null,
                refreshTokenEncrypt: null
            };
        }

        let token = response.access_token;
        let refreshToken = response.refresh_token;

        tokenEncrypt = encrypt(token);
        refreshTokenEncrypt = encrypt(refreshToken);

        if(independent) {
            let doc = await channelSchema.findOne({name: user});
            doc.twitch_user_token = encrypt(token);
            doc.twitch_user_refresh_token = encrypt(refreshToken);
            await doc.save();

            cache.hset(`${user}:streamer:data`, 'token', token);
            cache.hset(`${user}:streamer:data`, 'refresh_token', refreshToken);

            return { token }
        }

        return {
            tokenEncrypt,
            refreshTokenEncrypt
        }
    }
    catch (error) {
        console.error(`Error refreshing token for ${user} HTTP Request Catch: ${error}`);
    }
}

async function getNewAppToken() {
    try {
        let cache = getClient();
        let params = new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'client_credentials',
        });

        let response = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        });

        response = await response.json();

        if(response.status === 400) {
            console.error(`Error getting new app token HTTP Request: ${response.message}`);
            return null;
        }

        let token = response.access_token;

        let tokenEncrypt = encrypt(token);

        cache.set('domdimabot:app:token', token, 'EX', 60 * 60 * 24);

        let doc = await appConfigSchema.findOneAndUpdate({name: 'domdimabot'}, { access_token: tokenEncrypt });

        return {tokenEncrypt};
    }
    catch (error) {
        console.error(`Error getting new app token HTTP Request Catch: ${error}`);
    }
}

async function getAppToken() {
    try {
        let cache = getClient();

        let token = await cache.get('domdimabot:app:token');

        if(token !== null) return token;

        let doc = await appConfigSchema.findOne({name: 'domdimabot'});

        return decrypt(doc.access_token);
    }
    catch (error) {
        console.error(`Error getting app token HTTP Request Catch: ${error}`);
    }
}

module.exports = {
    refreshAllTokens,
    refreshToken,
    getNewAppToken,
    getAppToken
}