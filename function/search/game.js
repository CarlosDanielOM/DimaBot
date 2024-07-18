const { getBotHeader } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function searchGameById(gameID) {
    let botHeader = await getBotHeader();

    let params = new URLSearchParams();
    params.append('id', gameID);

    let response = await fetch(getTwitchHelixUrl('games', params), {
        headers: botHeader
    });

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
            message: 'Game not found',
            status: 404,
            type: 'Game not found'
        }
    }

    return {
        error: false,
        data: data.data[0]
    }
    
}

async function searchGameByName(gameName) {
    let botHeader = await getBotHeader();

    let params = new URLSearchParams();
    params.append('name', gameName);

    let response = await fetch(getTwitchHelixUrl('games', params), {
        headers: botHeader
    });

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
            message: 'Game not found',
            status: 404,
            type: 'Game not found'
        }
    }

    return {
        error: false,
        data: data.data[0]
    }
}

async function searchGameByIgdbId(igdbID) {
    let botHeader = await getBotHeader();

    let params = new URLSearchParams();
    params.append('external_id', igdbID);

    let response = await fetch(getTwitchHelixUrl('games', params), {
        headers: botHeader
    });

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
            message: 'Game not found',
            status: 404,
            type: 'Game not found'
        }
    }

    return {
        error: false,
        data: data.data[0]
    }
}

module.exports = {
    searchGameById,
    searchGameByName,
    searchGameByIgdbId
};