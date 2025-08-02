const addModerator = require('./addmoderator');
const removeModerator = require('./removemoderator');
const addVIP = require('./addvip');
const removeVIP = require('./removevip');
const getInformation = require('./getinformation');
const setInformation = require('./setinformation');
const getEditors = require('./geteditors');
const getSubscriptions = require('./getsubs');
const raid = require('./raid');
const unraid = require('./unraid');
const getFollowers = require('./getfollowers');

module.exports = {
    addModerator,
    removeModerator,
    addVIP,
    removeVIP,
    getInformation,
    setInformation,
    getEditors,
    getSubscriptions,
    raid,
    unraid,
    getFollowers
}