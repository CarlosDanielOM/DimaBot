const socketIO = require('socket.io');
const http = require('http');

let io = null;

async function websocket(app) {
    let server = http.createServer(app);
    io = socketIO(server);

    return server;
}

function getIO() {
    return io;
}

module.exports = {
    websocket,
    getIO
};