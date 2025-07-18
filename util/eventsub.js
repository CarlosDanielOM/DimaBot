require('dotenv').config();
const STREAMERS = require('../class/streamer');
const {getStreamerHeaderById} = require('./header');
const {getTwitchHelixURL} = require('./link');
const {getAppToken} = require('./token');
const eventsubSchema = require('../schema/eventsub');

const modID = '698614112';

const subcriptionsTypes = [
    {
        type: 'channel.follow',
        version: '2',
        condition: {
            broadcaster_user_id: '698614112',
            moderator_user_id: modID
        },
        config: {
            message: '$(user) has followed, Welcome to the stream!'
        }
    },
    {
        type: 'stream.online',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        },
        config: {
            message: '$(twitch channel) is now live! Playing $(twitch game)'
        }
    },
    {
        type: 'stream.offline',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        },
        config: {
            message: '$(twitch channel) is now offline!'
        }
    },
    {
        type: 'channel.raid',
        version: '1',
        condition: {
            to_broadcaster_user_id: '698614112'
        },
        config: {
            message: '$(raid channel) is raiding with $(raid viewers) viewers!',
            clipEnabled: true
        }
    },
    {
        type: 'channel.poll.progress',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        }
    },
    {
        type: 'channel.prediction.progress',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        }
    },
    {
        type: 'channel.hype_train.begin',
        version: '2',
        condition: {
            broadcaster_user_id: '698614112'
        },
        config: {
            message: 'Hype train has started! It started at $(hypetrain progress) and will end at $(hypetrain end)'
        }
    },
    {
        type: 'channel.hype_train.progress',
        version: '2',
        condition: {
            broadcaster_user_id: '698614112'
        },
        config: {
            message: 'Hype train has progressed to level $(hypetrain level)!'
        }
    },
    {
        type: 'channel.hype_train.end',
        version: '2',
        condition: {
            broadcaster_user_id: '698614112'
        },
        config: {
            message: 'Hype train has ended! It ended at level $(hypetrain level) with $(hypetrain progress)% progress!'
        }
    },
    {
        type: 'channel.shoutout.receive',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112',
            moderator_user_id: modID
        },
        config: {
            message: '$(shoutout channel) has sent a shoutout to $(twitch channel)!'
        }
    },
    {
        type: 'channel.ad_break.begin',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        },
        config: {
            message: '$(ad duration) seconds of ad break has begun!',
            endMessage: 'Ad break has ended!',
            endEnabled: true
        }
    },
    {
        type: 'user.update',
        version: '1',
        condition: {
            user_id: '698614112'
        },
    },
    {
        type: 'channel.cheer',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        },
        config: {
            message: '$(user) cheered $(cheer amount) bits!'
        }
    },
    {
        type: 'channel.subscribe',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        },
        config: {
            message: '$(user) subscribed with $(sub tier) for the first time!'
        }
    },
    {
        type: 'channel.subscription.gift',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        },
        config: {
            message: '$(user) gifted a $(sub tier) subscription to $(gifted user)!'
        }
    },
    {
        type: 'channel.subscription.message',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        },
        config: {
            message: '$(user) resubscribed with $(sub tier) for $(sub months) months on a row!'
        }
    },
    {
        type: 'channel.update',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        },
    },
    {
        type: 'channel.bits.use',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        },
    },
    {
        type: 'automod.message.hold',
        version: '1',
        condition: {
            broadcaster_user_id: '698614112'
        },
    },
];

async function subscribeTwitchEvent(channelID, type, version, condition, config = null) {
    let streamer = await STREAMERS.getStreamerById(channelID);
    let streamerHeaders = await getStreamerHeaderById(channelID);
    let appAccessToken = await getAppToken();

    if(!appAccessToken) {
        console.error('Error getting app access token');
        return {
            error: 'Error getting app access token',
            message: 'Error getting app access token',
            status: 500
        };
    }

    streamerHeaders['Authorization'] = `Bearer ${appAccessToken}`;

    let response = await fetch(`${getTwitchHelixURL()}/eventsub/subscriptions`, {
        method: 'POST',
        headers: streamerHeaders,
        body: JSON.stringify({
            type,
            version,
            condition,
            transport: {
                method: 'webhook',
                callback: `https://subscriptions.domdimabot.com/eventsub`,
                secret: process.env.TWITCH_EVENTSUB_SECRET
            }
        })
    });
    
    response = await response.json();

    if(response.error) {
        console.error(`Error subscribing to ${type} for ${channelID}: ${response.error}`);
        return response;
    }
    
    let data = response.data[0];

    let newEventSub = new eventsubSchema({
        id: data.id,
        status: data.status,
        type: data.type,
        version: data.version,
        condition: data.condition,
        created_at: data.created_at,
        transport: data.transport,
        cost: data.cost,
        channel: streamer.name,
        channelID: channelID
    });

    if(config) {
        for(let key in config) {
            newEventSub[key] = config[key];
        }
    }

    await newEventSub.save();

    return data;
    
}

async function getEventsubs() {
    let appToken = await getAppToken();

    let headers = {
        'Authorization': `Bearer ${appToken}`,
        'Client-ID': process.env.CLIENT_ID,
        'Content-Type': 'application/json'
    }

    let response = await fetch(`${getTwitchHelixURL()}/eventsub/subscriptions`, {
        headers
    })

    response = await response.json();

    return response;
}

async function unsubscribeTwitchEvent(id) {
    let appAccessToken = await getAppToken();

    if(!appAccessToken) {
        console.error('Error getting app access token');
        return {
            error: 'Error getting app access token',
            message: 'Error getting app access token',
            status: 500
        };
    }

    let headers = {
        'Authorization': `Bearer ${appAccessToken}`,
        'Client-ID': process.env.CLIENT_ID,
        'Content-Type': 'application/json'
    }

    let response = await fetch(`${getTwitchHelixURL()}/eventsub/subscriptions?id=${id}`, {
        method: 'DELETE',
        headers
    });

    if(response.status === 204) {
        await eventsubSchema.deleteOne({id});
        return response;
    }

    response = await response.json();

    if(response.error) {
        console.error(`Error unsubscribing to ${id}: ${response.error}`);
        return response;
    }

    return response;
}

module.exports = {
    subscribeTwitchEvent,
    getEventsubs,
    unsubscribeTwitchEvent,
    subcriptionsTypes
}