const e = require("cors");
const { getClient } = require("../util/database/dragonfly");

async function sumimetro(channelID, user, touser) {
    // if(touser === 'reset') {
    //     return await resetSumimetro(channelID);
    // }
    
    const cacheClient = getClient();
    let random = Math.floor(Math.random() * 101);
    if(random > 100) {
        random = 100;
    }

    let dominant = random;
    let submissive = 100 - random;

    const lowerCaseUser = user.toLowerCase();
    const lowerCaseToUser = touser.toLowerCase();

    let exists = await cacheClient.get(`${channelID}:sumimetro:${lowerCaseUser}`);
    if(exists) {
        return {
            error: false,
            message: `El usuario ${user} el dia de hoy salio: ${100 - exists}% sumiso y ${exists}% dominante`,
            status: 400,
            type: 'error'
        }
    }

    await cacheClient.set(`${channelID}:sumimetro:${lowerCaseUser}`, dominant, 'EX', 72000);

    if(lowerCaseUser !== lowerCaseToUser) {
        exists = await cacheClient.get(`${channelID}:sumimetro:${lowerCaseToUser}`);
        if(exists) {
            return {
                error: false,
                message: `El usuario ${touser} el dia de hoy salio: ${100 - exists}% sumiso y ${exists}% dominante`,
                status: 400,
                type: 'error'
            }
        } else {
            return {
                error: false,
                message: `El usuario ${touser} todavia no se ha dado su lectura del sumimetro`,
                status: 200,
                type: 'success'
            }
        }
    }

    if(dominant > 50) {
        let supremeDominant = await cacheClient.hget(`${channelID}:sumimetro:dominant`, 'value');
        if(!supremeDominant) {
            await cacheClient.hset(`${channelID}:sumimetro:dominant`, 'user', user);
            await cacheClient.hset(`${channelID}:sumimetro:dominant`, 'value', dominant);
            supremeDominant = dominant;

            let response = await fetch(`https://api.domdimabot.com/sumimetro/dominante/${channelID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username: user, value: supremeDominant})
            });
        } else {
            if(dominant > supremeDominant) {
                await cacheClient.hset(`${channelID}:sumimetro:dominant`, 'user', user);
                await cacheClient.hset(`${channelID}:sumimetro:dominant`, 'value', dominant);
                supremeDominant = dominant;
    
                let response = await fetch(`https://api.domdimabot.com/sumimetro/dominante/${channelID}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({username: user, value: supremeDominant})
                })
            }
        }

        
        
    } else {
        let supremeSubmissive = await cacheClient.hget(`${channelID}:sumimetro:submissive`, 'value');
        if(!supremeSubmissive) {
            await cacheClient.hset(`${channelID}:sumimetro:submissive`, 'user', user);
            await cacheClient.hset(`${channelID}:sumimetro:submissive`, 'value', submissive);
            supremeSubmissive = submissive;

            let response = await fetch(`https://api.domdimabot.com/sumimetro/sumiso/${channelID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username: user, value: supremeSubmissive})
            });
            
        }else {
            if(submissive > supremeSubmissive) {
                await cacheClient.hset(`${channelID}:sumimetro:submissive`, 'user', user);
                await cacheClient.hset(`${channelID}:sumimetro:submissive`, 'value', submissive);
                supremeSubmissive = submissive;

                let response = await fetch(`https://api.domdimabot.com/sumimetro/sumiso/${channelID}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({username: user, value: supremeSubmissive})
                });
            }
        }
    }

    return {
        error: false,
        message: `Los lectores del sumimetro reflejan que ${user} tiene ${submissive}% de sumiso y ${dominant}% de dominante`,
        status: 200,
        type: 'success'
    }
    
}

module.exports = sumimetro;

async function resetSumimetro(channelID) {
    const cacheClient = getClient();
    await cacheClient.del(`${channelID}:sumimetro:dominant`);
    await cacheClient.del(`${channelID}:sumimetro:submissive`);

    await cacheClient.keys(`${channelID}:sumimetro:*`).then(async keys => {
        for(let key of keys) {
            await cacheClient.del(key);
        }
    });
    
    return {
        error: false,
        message: 'Sumimetro has been reset',
        status: 200,
        type: 'success'
    }
}