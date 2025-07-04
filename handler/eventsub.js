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
const resetCacheAtOffline = require('../handler_function/clearcache')
const logger = require('../util/logger')
const clearSpeachFiles = require('../handler_function/clearspeachfiles')
const addCommandsToCache = require('../handler_function/addcommandstocache')
const chatHistory = require('../class/chatHistory')

async function eventsubHandler(subscriptionData, eventData) {
    const client = CLIENT.getClient();
    let cacheClient = getClient();
    let chatEnabled = true;
    let streamer = await STREAMERS.getStreamerById(eventData.broadcaster_user_id);
    if(!streamer) {
        streamer = await STREAMERS.getStreamerById(eventData.to_broadcaster_user_id);
        if(!streamer) return;
    }
    if(streamer.chat_enabled == "false") chatEnabled = false;
    
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
            let followDayCount = await cacheClient.get(`${eventData.broadcaster_user_id}:follows:count`);
            if(!followDayCount) {
                followDayCount = 0;
            }
            followDayCount++;
            await cacheClient.set(`${eventData.broadcaster_user_id}:follows:count`, followDayCount);
            
            if(eventsubData.message == '' || eventsubData.message == null) {
                eventsubData.message = `$(user) has followed the channel! Welcome!`;
            };

            eventsubData.message = eventsubData.message + ` (Follow #${followDayCount})`;
            
            defaultMessages(client, eventData, eventsubData.message, chatEnabled);
            break;
        case 'stream.online':
            if(eventsubData.message == '' || eventsubData.message == null) {
                eventsubData.message = `Hey! $(twitch channel) is live! $(twitch title) playing $(twitch game)!`;
            };
            defaultMessages(client, eventData, eventsubData.message, chatEnabled);
            await getEditors(eventData.broadcaster_user_id, true);
            await addCommandsToCache(eventData.broadcaster_user_id);
            //! SEPARATOR FOR FUNCTIONS
            unVIPExpiredUser(client, eventData);
            await startTimerCommands(client, eventData);
            break;
        case 'stream.offline':
            if(eventsubData.message == '' || eventsubData.message == null) {
                eventsubData.message = `Hey! $(twitch channel) has gone offline!`;
            };
            defaultMessages(client, eventData, eventsubData.message, chatEnabled);
            //! SEPARATOR FOR FUNCTIONS
            resetRedemptionPrice(client, eventData.broadcaster_user_id);
            stopTimerCommands(client, eventData);
            resetSumimetro(eventData.broadcaster_user_id);
            resetCommandsFromCache(client, eventData.broadcaster_user_id);
            resetCacheAtOffline(eventData.broadcaster_user_id);
            clearSpeachFiles(eventData.broadcaster_user_id);
            await chatHistory.clearHistory(eventData.broadcaster_user_id);
            try {
                await cacheClient.del(`${eventData.broadcaster_user_id}:channel:editors`);
            } catch (error) {
                console.log({error: 'Error deleting editors from cache', message: error});
            }
            break;
        case 'channel.channel_points_custom_reward_redemption.add':
            logger({data: eventData, type: 'channel.channel_points_custom_reward_redemption.add'}, true, eventData.broadcaster_user_id, 'eventsub_redeem');
            redeemHandler(client, eventData);
            break;
        case 'channel.ad_break.begin':
            if(eventsubData.message == '' || eventsubData.message == null) {
                eventsubData.message = `Hey! $(twitch channel) is having a $(ad time) seconds ad-break!`;
            };
            defaultMessages(client, eventData, eventsubData.message, chatEnabled);
            if(!eventsubData.endEnabled) return;
            setTimeout(() => {
                if(eventsubData.endMessage == '' || eventsubData.endMessage == null) {
                    eventsubData.endMessage = `Hey! the ad-break has ended!`;
                };
                defaultMessages(client, eventData, eventsubData.endMessage, chatEnabled);
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
                defaultMessages(client, eventData, eventsubData.temporalBanMessage, chatEnabled)
            } else {
                if(eventsubData.message == '' || eventsubData.message == null) {
                    eventsubData.message = `$(user) has been banned for from the channel! by $(ban mod) for $(ban reason)`
                }
                defaultMessages(client, eventData, eventsubData.message, chatEnabled)
            }
            break;
    }
}

module.exports = eventsubHandler;