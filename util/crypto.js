require('dotenv').config();
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
// Ensure the secret key is always 32 bytes; fall back to empty string if undefined
const secretKey = Buffer.from((process.env.SECRET_KEY || '').padEnd(32), 'utf-8');

function encrypt(text) {
    if (!text) return { iv: '', content: '' };
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    }
}

function isValidHex(value) {
    return typeof value === 'string' && value.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(value);
}

function decrypt(hash) {
    try {
        if (!hash || typeof hash !== 'object') return '';
        const ivHex = hash.iv || '';
        const contentHex = hash.content || '';
        if (!isValidHex(ivHex) || !isValidHex(contentHex)) return '';

        const ivBuffer = Buffer.from(ivHex, 'hex');
        if (ivBuffer.length !== 16) return '';

        const decipher = crypto.createDecipheriv(algorithm, secretKey, ivBuffer);
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(contentHex, 'hex')),
            decipher.final()
        ]);
        return decrypted.toString();
    } catch (error) {
        // On any decryption error, return empty string to avoid runtime crashes
        return '';
    }
}

module.exports = {
    encrypt,
    decrypt
}