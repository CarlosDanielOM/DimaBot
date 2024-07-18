const STREAMERS = require('../class/streamer');
const TimerService = require('./timer.service');

async function stopTimerCommands(client, eventData) {
    const {broadcaster_user_id} = eventData;
    const streamer = await STREAMERS.getStreamerById(broadcaster_user_id);

    let timers = TimerService.getTimer(streamer.name);

    if(!timers) return { error: true, message: 'No timers found', status: 404, type: 'no_timers_found' };
    
    for (let i = timers.length - 1; i >= 0; i--) {
        TimerService.clearTimer(streamer.name, timers[i].cmd);
    }

    return { error: false, message: 'Timers stopped' };
    
}

module.exports = stopTimerCommands;