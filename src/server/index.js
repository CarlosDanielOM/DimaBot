const dragonfly = require("../../util/database/dragonfly");
const mongodb = require("../../util/database/mongodb");
const server = require("./server");
const websocket = require("./websocket");
const STREAMERS = require("../../class/streamer")
const CLIENT = require('../../util/client');
const CACHE = require('../../util/cache');

async function serverInit() {
  try {

    await CLIENT.clientConnect();
    
    await dragonfly.init();
    await mongodb.init();
    await STREAMERS.init();
    await CACHE.checkIfCacheExists();
    
    let app = await server();
    let ws = await websocket.websocket(app);

    ws.listen(3000, () => {
      console.log('Server listening on port 3000');
    });
  }
  catch (error) {
    console.error('Error on server init: ', error);
  }
}

serverInit();