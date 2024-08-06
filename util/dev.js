let production = true;

module.exports = {
    isProduction: () => {return production},
    getUrl: () => {
        let url;
        if (production) {
            url = "https://api.domdimabot.com"
        } else {
            url = "http://localhost:3000";
            // url = "https://api.domdimabot.com"
        }
        return url;
    },
    refreshAllTokens: async fun => {
        try {
            if(production) {
                await fun();
            }
        } catch (error) {
            console.error('Error on refreshing all tokens: ', error);
        }
    },
    connectChannels: async (fun, client) => {
        try {
            if(production) {
                fun();
            } else {
                await client.join('cdom201');
            }
        } catch (error) {
            console.error('Error on connecting channels: ', error);
        }
    },
    getClientOpts: () => {
        let options = null;
        if(production) {
            options = {
                options: {
                    debug: false
                },
                identity: {
                    username: process.env.TWITCH_USERNAME,
                    password: process.env.User_Token_Auth,
                },
                channels: ['domdimabot']
            }
        }
        else {
            options = {
                options: {
                    debug: true
                },
                identity: {
                    username: process.env.TWITCH_USERNAME,
                    password: process.env.User_Token_Auth
                },
                channels: ['domdimabot']
            }
        }
        return options;
    }
}