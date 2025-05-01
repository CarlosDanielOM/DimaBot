const fs = require('fs');
const { exec } = require('node:child_process')

const DOWNLOADPATH = `${__dirname}/public/downloads`;

async function downloadClip(url, channelID) {
    return new Promise((resolve, reject) => {
        const downloadProcess = exec(`twitch-dl download -q 480p -o ${DOWNLOADPATH}/${channelID}-clip.mp4 ${url}`);

        const timeout = setTimeout(() => {
            console.log(`Timeout for ${channelID}`);
            downloadProcess.kill();
            reject(new Error('Download timeout'));
        }, 10000);

        downloadProcess.on('exit', (code) => {
            clearTimeout(timeout);
            if(code === 0) {
                resolve(true);
            } else {
                logger({error: true, message: 'Clip download failed on download with code: ' + code, status: 500, type: 'error', channelID, clipUrl: url}, true, channelID, 'clip download failed');
                reject(new Error('Clip download failed on download'));
            }
        });

        downloadProcess.on('error', (err) => {
            logger({error: true, message: 'Clip download failed with error: ' + err, status: 500, type: 'error', channelID, clipUrl: url}, true, channelID, 'clip download failed');
            clearTimeout(timeout);
            reject(new Error('Clip download failed on error'));
        });
    });
}

async function deleteOldClip(channelID) {
    try {
        fs.unlinkSync(`${DOWNLOADPATH}/${channelID}-clip.mp4`);
    } catch (error) {
        logger({error: true, message: 'Clip file to delete not found.', status: 404, type: 'error', channelID}, true, channelID, 'clip file to delete not found');
    }
}

module.exports = {
    downloadClip,
    deleteOldClip
}