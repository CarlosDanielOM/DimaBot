const { getClient } = require("../util/database/dragonfly");

async function auth(req, res, next) {
    let cacheClient = getClient();

    let token = req.headers['Authorization'];
    console.log({token, where: 'auth'})
    if (!token) {
        return res.status(401).send({
            error: 'Unauthorized',
            message: 'No token provided',
            status: 401
        });
    }

    let exists = await cacheClient.exists(`token:${token}`);

    if(exists) {
        return next();
    }

    let response = await fetch(`https://id.twitch.tv/oauth2/validate`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    let data = await response.json();

    if(data.status === 401) {
        return res.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid token',
            status: 401
        });
    }

    await cacheClient.set(`token:${token}`, 1);
    await cacheClient.expire(`token:${token}`, 14000);

    next();

}

module.exports = auth;