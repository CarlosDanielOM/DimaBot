const { getBotHeader } = require("../../util/header");
const { getTwitchHelixUrl } = require("../../util/link");

async function searchCategories(query) {
    let botHeader = await getBotHeader();

    let params = new URLSearchParams();
    params.append('query', query);

    let response = await fetch(getTwitchHelixUrl('search/categories', params), {
        headers: botHeader
    });

    let data = await response.json();

    if(data.error) {
        return {
            error: true,
            message: data.message,
            status: data.status,
            type: data.error
        }
    }

    return {
        error: false,
        data: data.data
    }
    
}

module.exports = searchCategories;