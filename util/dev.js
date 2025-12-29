require('dotenv').config();

// Environment detection: 'production', 'dev', or 'test'
// Defaults to 'dev' if not specified
const environment = process.env.ENVIRONMENT || (process.env.PRODUCTION == 1 ? 'production' : 'dev');

const isProduction = () => environment === 'production';
const isTest = () => environment === 'test';
const isDev = () => environment === 'dev';

module.exports = {
    isProduction,
    isTest,
    isDev,
    getEnvironment: () => environment,
    getUrl: () => {
        if (isProduction()) {
            return "https://api.domdimabot.com";
        }
        return "http://localhost:3000";
    },
    refreshAllTokens: async fun => {
        try {
            if(isProduction()) {
                await fun();
            }
        } catch (error) {
            console.error('Error on refreshing all tokens: ', error);
        }
    },
    connectChannels: async (fun, client) => {
        try {
            if(isProduction()) {
                fun();
            } else if (isTest()) {
                // In test mode, connect to channels specified in TEST_CHANNELS env var
                const testChannels = process.env.TEST_CHANNELS ? process.env.TEST_CHANNELS.split(',').map(c => c.trim()) : [];
                for (const channel of testChannels) {
                    if (channel) {
                        await client.join(channel);
                        console.log(`[TEST] Joined channel: ${channel}`);
                    }
                }
            } else {
                // Dev mode
                await client.join('cdom201');
            }
        } catch (error) {
            console.error('Error on connecting channels: ', error);
        }
    },
    getClientOpts: () => {
        if(isProduction()) {
            return {
                options: {
                    debug: false
                },
                identity: {
                    username: process.env.TWITCH_USERNAME,
                    password: process.env.User_Token_Auth,
                },
                channels: ['domdimabot']
            };
        }
        
        if (isTest()) {
            // Test mode: debug enabled, channels from TEST_CHANNELS env var
            const testChannels = process.env.TEST_CHANNELS ? process.env.TEST_CHANNELS.split(',').map(c => c.trim()) : [];
            return {
                options: {
                    debug: true
                },
                identity: {
                    username: process.env.TWITCH_USERNAME,
                    password: process.env.User_Token_Auth
                },
                channels: testChannels
            };
        }
        
        // Dev mode
        return {
            options: {
                debug: true
            },
            identity: {
                username: process.env.TWITCH_USERNAME,
                password: process.env.User_Token_Auth
            },
            channels: ['kyori_vt']
        };
    }
}