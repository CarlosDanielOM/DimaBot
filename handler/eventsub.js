const CLIENT = require('../util/client')
const STREAMERS = require('../class/streamer')
// Schemas
const eventsubSchema = require('../schema/eventsub')
// Handlers
const redeemHandler = require('../handler/redeem')
const raidHandler = require('../handler/raid')
// Functions


let twitchClient;

async function eventsubHandler(subscriptionData, eventData) {
    twitchClient = CLIENT.getClient();
}