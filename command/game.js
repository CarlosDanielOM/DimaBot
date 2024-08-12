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

    for(let category of gameInfo.data) {
        if(category.name.toLowerCase() === argument.toLowerCase()) {
            argument = category.id;
            break;
        } else {
            argument = null;
        }
    }

    if(!argument) {
        argument = gameInfo.data[0].id;
    }

    let gameData = {
        game_id: argument,
        game_name: gameInfo.data[0].name
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