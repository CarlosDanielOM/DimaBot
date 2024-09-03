const CHANNEL = require('../function/channel');
const categories = require('../function/search/categories')

async function game(channelID, argument = null, userLevel = 1, commandLevel = 7) {
    if(!argument || userLevel < commandLevel) {
        let game = await CHANNEL.getInformation(channelID);

        if(game.error) {
            return {
                error: true,
                message: game.message,
                status: game.status,
                type: 'error'
            };
        }

        let gameName = game.data.game_name;

        return {
            error: false,
            message: `The current game is ${gameName}`,
            status: 200,
            type: 'success'
        };
        
    }

    let gameInfo = await categories(argument);

    if(gameInfo.error) {
        return {
            error: true,
            message: gameInfo.message,
            status: gameInfo.status,
            type: gameInfo.type
        };
    }

    if(!gameInfo.data.length) {
        return {
            error: true,
            message: 'The game does not exist',
            status: 404,
            type: 'error'
        };
    }

    let gameID = null;
    let gameName = null;

    for(let category of gameInfo.data) {
        if(category.name.toLowerCase() === argument.toLowerCase()) {
            gameID = category.id;
            gameName = category.name;
            break;
        }
    }

    if(!gameID) {
        gameID = gameInfo.data[0].id;
        gameName = gameInfo.data[0].name;
    }

    let gameData = {
        game_id: gameID,
        game_name: gameName
    };
    
    let game = await CHANNEL.setInformation(channelID, gameData);

    if(game.error) {
        return {
            error: true,
            message: game.message,
            status: game.status,
            type: game.type
        };
    }

    return {
        error: false,
        message: `The game has been set to ${gameData.game_name}`,
        status: 200,
        type: 'success'
    };
}

module.exports = game;