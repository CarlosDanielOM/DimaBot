const CLIENT = require('../util/client')
const STREAMERS = require('../class/streamer')
// Schemas
const eventsubSchema = require('../schema/eventsub')
// Handlers
const redeemHandler = require('../handler/redeem')
const raidHandler = require('../handler/raid')
// Functions
const resetRedemptionPrice = require('../redemption_functions/resetredemptioncost');
const unVIPExpiredUser = require('../redemption_functions/unvipexpired');
const startTimerCommands = require('../timer_functions/starttimer');
const stopTimerCommands = require('../timer_functions/stoptimer');
const defaultMessages = require('../util/defaultmessage');
const resetSumimetro = require('../handler_function/resetsumimetro')
const resetCommandsFromCache = require('../handler_function/resetcommandscache')
const { getEditors } = require('../function/channel')
const { getClient } = require('../util/database/dragonfly')

async function eventsubHandler(subscriptionData, eventData) {
    const client = CLIENT.getClient();
    const cacheClient = getClient();
    let streamer = await STREAMERS.getStreamerById(eventData.broadcaster_user_id);
    if(!streamer) {
        streamer = await STREAMERS.getStreamerById(eventData.to_broadcaster_user_id);
        if(!streamer) return;
    }
    
    const {type, version, status, cost, id} = subscriptionData;
    let eventsubData = await eventsubSchema.findOne({type, channelID: streamer.user_id})
    if(!eventsubData) {
        eventsubData = {
            enabled: true
        }
        eventsubData.message = ''
        console.log({error: 'No data found', type, condition: subscriptionData.condition});
    }

    if(!eventsubData.enabled) return;

    switch(type) {
        case 'channel.follow':
            if(eventsubData.message == '' || eventsubData.message == null) {
                eventsubData.message = '$(user) has followed the channel! Welcome!';
            };
            defaultMessages(client, eventData, eventsubData.message);
            break;
        case 'stream.online':
            if(eventsubData.message == '' || eventsubData.message == null) {
                eventsubData.message = `Hey! $(twitch channel) is live! $(twitch title) playing $(twitch game)!`;
            };
            defaultMessages(client, eventData, eventsubData.message);
            await getEditors(eventData.broadcaster_user_id, true);
            //! SEPARATOR FOR FUNCTIONS
            unVIPExpiredUser(client, eventData);
            await startTimerCommands(client, eventData);
            break;
        case 'stream.offline':
            if(eventsubData.message == '' || eventsubData.message == null) {
                eventsubData.message = `Hey! $(twitch channel) has gone offline!`;
            };
            defaultMessages(client, eventData, eventsubData.message);
            //! SEPARATOR FOR FUNCTIONS
            resetRedemptionPrice(client, eventData.broadcaster_user_id);
            stopTimerCommands(client, eventData);
            resetSumimetro(eventData.broadcaster_user_id);
            resetCommandsFromCache(client, eventData.broadcaster_user_id);
            try {
                await cacheClient.del(`${eventData.broadcaster_user_id}:channel:editors`);
            } catch (error) {
                console.log({error: 'Error deleting editors from cache', message: error});
            }
            break;
        case 'channel.channel_points_custom_reward_redemption.add':
            redeemHandler(client, eventData);
            break;
        case 'channel.ad_break.begin':
            if(eventsubData.message == '' || eventsubData.message == null) {
                eventsubData.message = `Hey! $(twitch channel) is having a $(ad time) seconds ad-break!`;
            };
            defaultMessages(client, eventData, eventsubData.message);
            if(!eventsubData.endEnabled) return;
            setTimeout(() => {
                if(eventsubData.endMessage == '' || eventsubData.endMessage == null) {
                    eventsubData.endMessage = `Hey! the ad-break has ended!`;
                };
                defaultMessages(client, eventData, eventsubData.endMessage);
            }, eventData.duration_seconds * 1000);
            break;
        case 'channel.raid':
            if(!eventsubData.message || eventsubData.message == '' || eventsubData.message == null) {
                eventsubData.message = `Hey! $(twitch channel) is being raided by $(raid channel) with $(raid viewers) viewers!`
            }
            let clipEnabled = false;
            if(eventsubData.clipEnabled) clipEnabled = true;
            await raidHandler(client, eventData, eventsubData, clipEnabled);
            break;
        case 'channel.ban':
            if(!eventData.is_permanent) {
                if(eventsubData.temporalBanMessage == '' || eventsubData.temporalBanMessage == null) {
                    eventsubData.temporalBanMessage = `$(user) has been banned for $(ban time) seconds from the channel! by $(ban mod) for $(ban reason)`
                }
                defaultMessages(client, eventData, eventsubData.temporalBanMessage)
            } else {
                if(eventsubData.message == '' || eventsubData.message == null) {
                    eventsubData.message = `$(user) has been banned for from the channel! by $(ban mod) for $(ban reason)`
                }
                defaultMessages(client, eventData, eventsubData.message)
            }
            break;
    }
}

module.exports = eventsubHandler;