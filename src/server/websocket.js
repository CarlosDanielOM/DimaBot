const { Server } = require('socket.io');
const http = require('http');
const { getClient } = require('../../util/database/dragonfly');

let io = null;

async function websocket(app) {
    let server = http.createServer(app);
    io = new Server(server, {
        connectionStateRecovery: {}
    });

    //? Speach
    io.of(/^\/speech\/\w+$/).on('connection', async (socket) => {
        const channelID = socket.nsp.name.split('/')[2];
        console.log(`${channelID} connected to speech`);
    });

    //? Overlay triggers
    io.of(/^\/overlays\/triggers\/\w+$/).on('connection', async (socket) => {
        const channelID = socket.nsp.name.split('/')[3];
        console.log(`${channelID} connected to triggers`);
    });

    //? Clip
    io.of(/^\/clip\/\w+$/).on('connection', async (socket) => {
        const channelID = socket.nsp.name.split('/')[2];
        console.log(`${channelID} connected to clip`);
    });
    
    //? Sumimetro
    io.of(/^\/sumimetro\/\w+\/\w+$/).on('connection', async (socket) => {
        const cacheClient = getClient();
        const type = socket.nsp.name.split('/')[2];
        const channelID = socket.nsp.name.split('/')[3];

        if(type == 'sumiso') {
            let value = await cacheClient.hget(`${channelID}:sumimetro:submissive`, 'value');
            let username = await cacheClient.hget(`${channelID}:sumimetro:submissive`, 'user');
            
            if (value !== null && username !== null) {
                socket.emit('sumimetro', {username, value});
            }
        }

        if(type == 'dominante') {
            let value = await cacheClient.hget(`${channelID}:sumimetro:dominant`, 'value');
            let username = await cacheClient.hget(`${channelID}:sumimetro:dominant`, 'user');
            
            if (value !== null && username !== null) {
                socket.emit('sumimetro', {username, value});
            }
        }

        socket.on('disconnect', () => {
            console.log(`${channelID} disconnected from sumimetro ${type}`);
        });
    });

    io.on('error', (error) => {
        console.error('Websocket error:', error);
    });
    
    return server;
}

function getIO() {
    return io;
}

module.exports = {
    websocket,
    getIO
};