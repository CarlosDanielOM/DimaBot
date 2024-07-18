const { getBotHeader } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function getUserById(userID) {
    let botHeader = await getBotHeader();

    let params = new URLSearchParams();
    params.append('id', userID);

    let response = await fetch(getTwitchHelixUrl('users', params), {
        headers: botHeader
    })

    let data = await response.json();

    if(data.error) {
        return {
            error: true,
            message: data.message,
            status: data.status,
            type: data.error
        }
    }

    if(data.data.length === 0) {
        return {
            error: true,
            message: 'User not found',
            status: 404,
            type: 'User not found'
        }
    }

    return {
        error: false,
        data: data.data[0]
    }
    
}

async function getUserByLogin(username) {
    let botHeader = await getBotHeader();

    let params = new URLSearchParams();
    params.append('login', username);

    let response = await fetch(getTwitchHelixUrl('users', params), {
        headers: botHeader
    })

    let data = await response.json();

    if(data.error) {
        return {
            error: true,
            message: data.message,
            status: data.status,
            type: data.error
        }
    }

    if(data.data.length === 0) {
        return {
            error: true,
            message: 'User not found',
            status: 404,
            type: 'User not found'
        }
    }

    return {
        error: false,
        data: data.data[0]
    }
}

module.exports = {
    getUserById,
    getUserByLogin
}