const { getClient } = require("../util/database/dragonfly");

async function furrometro(channelID, user) {
    let cacheClient = getClient();

    let exists = await cacheClient.get(`${channelID}:furrymeter:${user.toLowerCase()}`);

    if(exists) {
        return {
            error: false,
            message: `${user} el dia de hoy tiene un nivel de furro del ${exists}%`,
            status: 200,
            type: 'success'
        };
    }
    
    let supremeFurry = await cacheClient.hget(`${channelID}:supremeFurry`, 'value');

    if(!supremeFurry) {
        supremeFurry = 0;
    }

    supremeFurry = parseInt(supremeFurry);

    let random = Math.floor(Math.random() * 101);
    if(random > 100) {
        random = 100;
    }

    if(random > supremeFurry) {
        supremeFurry = random;
        // await cacheClient.set(`${channelID}:supremeFurry`, supremeFurry, 'EX', 60 * 60 * 8);
        await cacheClient.hset(`${channelID}:supremeFurry`, 'value', supremeFurry);
        await cacheClient.hset(`${channelID}:supremeFurry`, 'username', user);

        await cacheClient.expire(`${channelID}:supremeFurry`, 60 * 60 * 8);

        await fetch(`https://api.domdimabot.com/overlays/furry/${channelID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: user,
                value: supremeFurry
            })
        });
    }
    
    cacheClient.set(`${channelID}:furrymeter:${user.toLowerCase()}`, random, 'EX', 60 * 60 * 8);

    return {
        error: false,
        message: `${user} tiene un nivel de furro del ${random}%`,
        status: 200,
        type: 'success'
    };
    
}

module.exports = furrometro;