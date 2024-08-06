const STREAMER = require('../class/streamer');
const {getUserByLogin} = require('../function/user/getuser');
const { getStreamerHeaderById } = require('../util/header');
const { getTwitchHelixUrl } = require('../util/link');

async function followage(channelID, user) {
    let userObj = await getUserByLogin(user.toLowerCase());
    userObj = userObj.data;
    let streamer = await STREAMER.getStreamerById(channelID);

    if(userObj.error) {
        return {
            error: true,
            message: userObj.message,
            status: userObj.status,
            type: userObj.type
        }
    }

    let params = new URLSearchParams();
    params.append('broadcaster_id', channelID);
    params.append('user_id', userObj.id);

    let streamerHeader = await getStreamerHeaderById(channelID);
    
    let response = await fetch(getTwitchHelixUrl('channels/followers', params), {
        headers: streamerHeader
    })
    
    let data = await response.json();
    
    if(data.error) {
        return {
            error: true,
            message: data.message,
            status: data.status,
            type: data.type
        }
    }
    
    if(data.data.length < 1) {
        return {
            error: true,
            message: `${user} is not following the channel`,
            status: 404,
            type: 'not_found'
        }
    }
    
    data = data.data[0];
    
    if (!data) {
        return {
            error: true,
            message: 'User is not following the channel',
            status: 404,
            type: 'not_found'
        }
    }
    
    let followDate = new Date(data.followed_at);
    let currentDate = new Date();

    let diff = currentDate - followDate;

    let hour = (1000 * 3600);
    let day = 24;
    let month = 30.5;
    let year = 12;

    let days = 0;
    let months = 0;
    let years = 0;

    let hours = Math.floor(diff / hour);
    days = Math.floor(hours / day);
    hours = Math.floor(hours % day);
    months = Math.floor(days / month);
    days = Math.floor(days % month);
    years = Math.floor(months / year);
    months = Math.floor(months % year);

    
    let followage = {
        days: days,
        months: months,
        years: years
    }

    let message = `${user} has been following ${streamer.name} for: `;

    if(followage.years > 0) {
        message += `${followage.years} years, `;
    }

    if(followage.months > 0) {
        message += `${followage.months} months, `;
    }

    if(followage.days > 0) {
        message += `${followage.days} days, `;
    }

    message += `${hours} hours`;

    return {
        error: false,
        message: message,
        status: 200,
        type: 'success'
    }
    
}

module.exports = followage;