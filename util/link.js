function getTwitchHelixURL() {
    return "https://api.twitch.tv/helix";
}

/**
 * Get the Twitch Helix URL for a given endpoint
 * @param {string} endpoint - The endpoint to get the URL for
 * @param {string} params - The parameters to add to the URL
 * @returns {string} The Twitch Helix URL for the given endpoint
 */

function getTwitchHelixUrl(endpoint, params = null) {
    return "https://api.twitch.tv/helix/" + endpoint + (params ? "?" + params : "");
}

function getTwitchOAuthURL() {
    return "https://id.twitch.tv/oauth2";
}

function getSpotifyURL() {
    return "https://api.spotify.com/v1"
}

function getSpotifyAuthURL() {
    return "https://accounts.spotify.com/api"
}

module.exports = {
    getTwitchHelixURL,
    getTwitchOAuthURL,
    getSpotifyURL,
    getSpotifyAuthURL,
    getTwitchHelixUrl
};