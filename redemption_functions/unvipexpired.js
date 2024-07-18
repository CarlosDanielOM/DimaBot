const vipSchema = require('../schema/vip');
const CHANNEL = require('../function/channel')

async function unVIPExpiredUser(client, eventData) {
    const { broadcaster_user_id, broadcaster_user_login } = eventData;

    let vipReward = await vipSchema.find({channelID: broadcaster_user_id, vip: true});

    if(vipReward.length === 0) return { error: true, message: 'No VIPs found' };

    let currentData = Date.now();

    vipReward.forEach(async vip => {
        let expireDate = new Date(vip.expireDate.year, vip.expireDate.month, vip.expireDate.day).getTime();

        if(currentData > expireDate) {
            let result = await CHANNEL.removeVIP(broadcaster_user_id, vip.userID);
            if(result.error) {
                console.log({
                    error: result,
                    where: 'unVIPExpiredUser',
                    channel: broadcaster_user_login,
                })
                return {
                    error: true,
                    message: 'Error removing VIP',
                    status: 500,
                    type: 'error_removing_vip'
                }
            }

            await vipSchema.deleteOne({userID: vip.userID, channelID: broadcaster_user_id});
        }
        
    })
    
}

module.exports = unVIPExpiredUser;