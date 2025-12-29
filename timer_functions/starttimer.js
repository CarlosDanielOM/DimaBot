const TimerService = require('./timer.service');
const commandSchema = require('../schema/command');
const commandTimerSchema = require('../schema/commandtimer');
const STREAMERS = require('../class/streamer');
const sendChatMessage = require('../function/chat/sendmessage');

async function startTimerCommands(eventData) {
    const {broadcaster_user_id, broadcaster_user_login} = eventData;
    let timers = await commandTimerSchema.find({channelID: broadcaster_user_id});

    let streamer = await STREAMERS.getStreamerById(broadcaster_user_id);
    if(!streamer) return { error: true, message: 'Streamer not found', status: 404, type: 'streamer_not_found' };

    if(timers.length === 0) return { error: true, message: 'No timers found', status: 404, type: 'no_timers_found' };

    await creatingTimers(timers, broadcaster_user_id, streamer);
    
}

module.exports = startTimerCommands;

async function creatingTimers(timers, channelID, streamer) {
    let timerArray = [];
    await timers.forEach(async timer => {
        let command = await commandSchema.findOne({channelID: channelID, cmd: timer.command});

        if(!command) {
            console.log({
                where: 'creatingTimers',
                message: 'Command not found',
                channel: streamer.name,
                command: timer.command,
            })
            return;
        }

        let newTimer = setInterval(() => {
            sendChatMessage(channelID, command.message);
        }, timer.timer * (1000 * 60));

        timerArray.push(newTimer);
        
    });

    TimerService.addTimer(channelID, timerArray);
}