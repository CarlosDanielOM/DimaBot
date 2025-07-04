const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: `https://${process.env.S3_REGION}.${process.env.S3_ENDPOINT}`,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    }
});

const BUCKET = process.env.S3_BUCKET;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || `https://${BUCKET}.${process.env.S3_REGION}.${process.env.S3_ENDPOINT}`;

async function uploadCSS(channelID, designId, cssContent) {
    try {
        const key = `clip-designs/${channelID}/${designId}.css`;
        
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: cssContent,
            ContentType: 'text/css',
            ACL: 'public-read',
            CacheControl: 'public, max-age=31536000' // Cache for 1 year
        });

        await s3Client.send(command);
        
        // Return the public URL
        return `${S3_PUBLIC_URL}/${key}`;
    } catch (error) {
        console.error('Error uploading CSS to S3:', error);
        throw error;
    }
}

async function deleteCSS(channelID, designId) {
    try {
        const key = `clip-designs/${channelID}/${designId}.css`;
        
        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key
        });

        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error('Error deleting CSS from S3:', error);
        throw error;
    }
}

async function uploadTriggerFileToS3(channelID, stream, mimeType, key) {
    try {
        // key should be: `${channelID}/triggers/${filename}`
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: stream,
            ContentType: mimeType,
            ACL: 'public-read',
            CacheControl: 'public, max-age=31536000'
        });
        await s3Client.send(command);
        return `${S3_PUBLIC_URL}/${key}`;
    } catch (error) {
        console.error('Error uploading trigger file to S3:', error);
        throw error;
    }
}

async function deleteTriggerFileFromS3(channelID, key) {
    try {
        // key should be: `${channelID}/triggers/${filename}`
        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key
        });
        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error('Error deleting trigger file from S3:', error);
        throw error;
    }
}

module.exports = {
    uploadCSS,
    deleteCSS,
    uploadTriggerFileToS3,
    deleteTriggerFileFromS3
}; 