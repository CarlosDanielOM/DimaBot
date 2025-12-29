require('dotenv').config();
const channelSchema = require('../../../schema/channel');
const eventsubSchema = require('../../../schema/eventsub');
const { subscribeTwitchEvent } = require('../../eventsub');

const BOT_USER_ID = '698614112';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Migration helper function to subscribe active channels to channel.chat.message eventsub
 * Only processes channels with non-null iv and content values on their token
 * 
 * @returns {Promise<{success: Array, failed: Array, skipped: Array}>} Results of the migration
 */
async function migrateChannelChatMessageEventsub() {
    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    try {
        // Find all channels with active tokens (non-null iv and content)
        const activeChannels = await channelSchema.find({
            'twitch_user_token.iv': { $ne: null },
            'twitch_user_token.content': { $ne: null },
            actived: true
        });

        console.log(`Found ${activeChannels.length} active channels with valid tokens`);

        for (const channel of activeChannels) {
            const channelID = channel.twitch_user_id;
            const channelName = channel.name;

            try {
                // Check if channel.chat.message subscription already exists for this channel
                const existingSubscription = await eventsubSchema.findOne({
                    type: 'channel.chat.message',
                    channelID: channelID
                });

                if (existingSubscription) {
                    console.log(`Skipping ${channelName} (${channelID}) - subscription already exists`);
                    results.skipped.push({
                        channelName,
                        channelID,
                        reason: 'Subscription already exists'
                    });
                    continue;
                }

                // Add delay before subscription to avoid rate limiting
                await delay(500);

                // Subscribe to channel.chat.message event
                const response = await subscribeTwitchEvent(
                    channelID,
                    'channel.chat.message',
                    '1',
                    {
                        broadcaster_user_id: channelID,
                        user_id: BOT_USER_ID
                    }
                );

                if (response.error) {
                    console.error(`Failed to subscribe ${channelName} (${channelID}): ${response.error}`);
                    results.failed.push({
                        channelName,
                        channelID,
                        error: response.error,
                        message: response.message
                    });
                    continue;
                }

                console.log(`Successfully subscribed ${channelName} (${channelID}) to channel.chat.message`);
                results.success.push({
                    channelName,
                    channelID,
                    subscriptionId: response.id
                });

            } catch (error) {
                console.error(`Error processing channel ${channelName} (${channelID}): ${error.message}`);
                results.failed.push({
                    channelName,
                    channelID,
                    error: error.message
                });
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`Success: ${results.success.length}`);
        console.log(`Failed: ${results.failed.length}`);
        console.log(`Skipped: ${results.skipped.length}`);

        return results;

    } catch (error) {
        console.error(`Migration failed: ${error.message}`);
        throw error;
    }
}

/**
 * Dry run version of the migration - only lists channels that would be migrated
 * without actually creating any subscriptions
 * 
 * @returns {Promise<{toMigrate: Array, alreadySubscribed: Array}>} Channels that would be affected
 */
async function dryRunMigration() {
    const results = {
        toMigrate: [],
        alreadySubscribed: []
    };

    try {
        const activeChannels = await channelSchema.find({
            'twitch_user_token.iv': { $ne: null },
            'twitch_user_token.content': { $ne: null },
            actived: true
        });

        console.log(`Found ${activeChannels.length} active channels with valid tokens`);

        for (const channel of activeChannels) {
            const channelID = channel.twitch_user_id;
            const channelName = channel.name;

            const existingSubscription = await eventsubSchema.findOne({
                type: 'channel.chat.message',
                channelID: channelID
            });

            if (existingSubscription) {
                results.alreadySubscribed.push({
                    channelName,
                    channelID,
                    subscriptionId: existingSubscription.id
                });
            } else {
                results.toMigrate.push({
                    channelName,
                    channelID
                });
            }
        }

        console.log('\n--- Dry Run Summary ---');
        console.log(`Would migrate: ${results.toMigrate.length}`);
        console.log(`Already subscribed: ${results.alreadySubscribed.length}`);

        return results;

    } catch (error) {
        console.error(`Dry run failed: ${error.message}`);
        throw error;
    }
}

module.exports = {
    migrateChannelChatMessageEventsub,
    dryRunMigration
};
