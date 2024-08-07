const {shoutout} = require('../command')
const textConvertor = require('./text')

const modID = '698614112';

async function raid(client, eventData, eventsubData, clipEnabled = false) {
    if (eventsubData.minViewers > eventData.viewers) return;
    const { to_broadcaster_user_id, to_broadcaster_user_login, from_broadcaster_user_id, from_broadcaster_user_name } = eventData;

    let so = await shoutout(to_broadcaster_user_id, from_broadcaster_user_name, 'purple');
    
    if(so.error) {
        console.log({
            error: true,
            message: so.message,
            status: so.status,
            type: so.type,
            where: 'raid shoutout'
        })
        return {
            error: true,
            message: so.message
        }
    }
}

module.exports = raid;