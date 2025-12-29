require('dotenv').config();
const channelSchema = require('../../../schema/channel');

/**
 * Disables chat_enabled for all active channels with chat_enabled set to true.
 * This is useful when authentication updates happen to prevent bot issues.
 * 
 * @returns {Promise<{success: Array, failed: Array, total: number}>} Results of the operation
 */
async function disableChatForActiveChannels() {
    const results = {
        success: [],
        failed: [],
        total: 0
    };

    try {
        // Find all channels that are active AND have chat_enabled
        const activeChannels = await channelSchema.find({
            actived: true,
            chat_enabled: true
        });

        results.total = activeChannels.length;
        console.log(`Found ${activeChannels.length} active channels with chat_enabled`);

        if (activeChannels.length === 0) {
            console.log('No channels to update');
            return results;
        }

        for (const channel of activeChannels) {
            const channelID = channel.twitch_user_id;
            const channelName = channel.name;

            try {
                await channelSchema.updateOne(
                    { _id: channel._id },
                    { $set: { chat_enabled: false } }
                );

                console.log(`Disabled chat_enabled for ${channelName} (${channelID})`);
                results.success.push({
                    channelName,
                    channelID
                });

            } catch (error) {
                console.error(`Error disabling chat for ${channelName} (${channelID}): ${error.message}`);
                results.failed.push({
                    channelName,
                    channelID,
                    error: error.message
                });
            }
        }

        console.log('\n--- Disable Chat Summary ---');
        console.log(`Success: ${results.success.length}`);
        console.log(`Failed: ${results.failed.length}`);

        return results;

    } catch (error) {
        console.error(`Operation failed: ${error.message}`);
        throw error;
    }
}

/**
 * Bulk update version - uses updateMany for better performance on large datasets
 * 
 * @returns {Promise<{modifiedCount: number, matchedCount: number}>} MongoDB update result
 */
async function disableChatForActiveChannelsBulk() {
    try {
        const result = await channelSchema.updateMany(
            {
                actived: true,
                chat_enabled: true
            },
            {
                $set: { chat_enabled: false }
            }
        );

        console.log('\n--- Bulk Disable Chat Summary ---');
        console.log(`Matched: ${result.matchedCount}`);
        console.log(`Modified: ${result.modifiedCount}`);

        return result;

    } catch (error) {
        console.error(`Bulk operation failed: ${error.message}`);
        throw error;
    }
}

/**
 * Dry run version - only lists channels that would be affected
 * without actually making any changes
 * 
 * @returns {Promise<{toDisable: Array}>} Channels that would be affected
 */
async function dryRunDisableChat() {
    const results = {
        toDisable: []
    };

    try {
        const activeChannels = await channelSchema.find({
            actived: true,
            chat_enabled: true
        });

        console.log(`Found ${activeChannels.length} channels that would be disabled`);

        for (const channel of activeChannels) {
            results.toDisable.push({
                channelName: channel.name,
                channelID: channel.twitch_user_id
            });
        }

        console.log('\n--- Dry Run Summary ---');
        console.log(`Would disable: ${results.toDisable.length}`);

        return results;

    } catch (error) {
        console.error(`Dry run failed: ${error.message}`);
        throw error;
    }
}

module.exports = {
    disableChatForActiveChannels,
    disableChatForActiveChannelsBulk,
    dryRunDisableChat
};
