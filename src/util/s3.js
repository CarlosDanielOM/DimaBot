const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || `https://${BUCKET_NAME}.${process.env.S3_REGION}.${process.env.S3_ENDPOINT}`;

async function uploadCSS(channelID, designId, cssContent) {
    try {
        const key = `clip-designs/${channelID}/${designId}.css`;
        
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
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
            Bucket: BUCKET_NAME,
            Key: key
        });

        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error('Error deleting CSS from S3:', error);
        throw error;
    }
}

module.exports = {
    uploadCSS,
    deleteCSS
}; 