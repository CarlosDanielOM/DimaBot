const { getTwitchHelixUrl } = require("../../util/link");
const { getAppToken } = require("../../util/token");

module.exports = async function getScopes(userID) {

    let params = new URLSearchParams();
    params.append('user_id', userID);

    let appAccessToken = await getAppToken();

    if(!appAccessToken) {
        return {
            error: true,
            message: 'Failed to get app access token',
            status: 500
        }
    }

    let response = await fetch(getTwitchHelixUrl('users/scopes', params), {
        headers: {
            'Authorization': `Bearer ${appAccessToken}`,
            'Client-Id': process.env.CLIENT_ID,
            'Content-Type': 'application/json'
        }

    })

    let data = await response.json();

    if(data.error) {
        return {
            error: true,
            message: data.message,
            status: data.status
        }
    }

    return data;
}