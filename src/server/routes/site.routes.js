const express = require('express');
const router = express.Router();
const auth = require('../../../middleware/auth');
const { getClient } = require('../../../util/database/dragonfly');

router.use(auth);

router.get('/', (req, res) => {
    let cacheClient = getClient();
});

module.exports = router;