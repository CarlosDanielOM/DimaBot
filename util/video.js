const fs = require('fs');
const logger = require("./logger"); // Assuming your logger exists
const { exec } = require('node:child_process');

const DOWNLOADPATH = `${__dirname}/public/downloads`;

async function downloadClip(url, channelID) {
    return new Promise((resolve, reject) => {
        // Note: Ensure DOWNLOADPATH exists before running this
        // Consider adding: if (!fs.existsSync(DOWNLOADPATH)) { fs.mkdirSync(DOWNLOADPATH, { recursive: true }); }

        const command = `twitch-dl download -q 480p -o "${DOWNLOADPATH}/${channelID}-clip.mp4" "${url}"`; // Added quotes for safety
        console.log(`Executing command: ${command}`); // Log the command being run
        const downloadProcess = exec(command);

        let stdoutData = '';
        let stderrData = '';

        // Capture stdout
        downloadProcess.stdout.on('data', (data) => {
            stdoutData += data;
            // Optional: log stdout progress if needed
            // console.log(`stdout: ${data}`);
        });

        // Capture stderr
        downloadProcess.stderr.on('data', (data) => {
            stderrData += data;
            // Optional: log stderr as it comes in
            // console.error(`stderr: ${data}`);
        });

        const timeout = setTimeout(() => {
            console.log(`Timeout triggered for ${channelID} downloading ${url}`);
            downloadProcess.kill(); // Attempt to kill the process
            // Note: Killing might not immediately trigger 'exit' or 'error' in all cases,
            // the rejection here ensures the promise finishes.
            reject(new Error(`Download timeout after 10 seconds for URL: ${url}`));
        }, 10000); // 10 seconds timeout

        downloadProcess.on('exit', (code) => {
            clearTimeout(timeout); // Clear timeout if process exits normally or with error code
            console.log(`twitch-dl process exited with code ${code} for ${url}`); // Log exit code

            if (code === 0) {
                resolve(true); // Success
            } else {
                // Log the captured stderr which likely contains the actual error message
                const errorMessage = `Clip download failed with exit code: ${code}. Stderr: ${stderrData || 'No stderr output.'} Stdout: ${stdoutData || 'No stdout output.'}`;
                logger({
                    error: true,
                    message: errorMessage,
                    status: 500, // Or potentially a different status based on error
                    type: 'error',
                    channelID,
                    clipUrl: url
                }, true, channelID, 'clip download failed');
                reject(new Error(`Clip download failed. Exit code: ${code}. Check logs for details.`));
            }
        });

        downloadProcess.on('error', (err) => {
            clearTimeout(timeout); // Clear timeout on spawn error
            console.error(`Failed to start or run twitch-dl process for ${url}: ${err.message}`); // Log the spawn error

            // Log the spawn error itself
            logger({
                error: true,
                message: `Clip download process error: ${err.message}`,
                status: 500,
                type: 'error',
                channelID,
                clipUrl: url,
                spawnError: err // Include the actual error object if logger supports it
            }, true, channelID, 'clip download process error');
            reject(new Error(`Clip download failed to start or run: ${err.message}`));
        });
    });
}

// --- deleteOldClip remains the same ---
async function deleteOldClip(channelID) {
    const filePath = `${DOWNLOADPATH}/${channelID}-clip.mp4`;
    try {
        // Check if file exists before attempting to delete
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted old clip: ${filePath}`);
        } else {
            console.log(`Clip file to delete not found (normal if first download): ${filePath}`);
            // Decide if you want to log this scenario via your logger or just console
            // logger({error: false, message: 'Clip file to delete not found.', status: 404, type: 'info', channelID}, false, channelID, 'clip file to delete not found');
        }
    } catch (error) {
        console.error(`Error deleting file ${filePath}: ${error.message}`);
        // Log the error during deletion attempt
        logger({
            error: true,
            message: `Error deleting clip file: ${error.message}`,
            status: 500,
            type: 'error',
            channelID,
            filePath: filePath
        }, true, channelID, 'clip file deletion error');
    }
}


module.exports = {
    downloadClip,
    deleteOldClip
};