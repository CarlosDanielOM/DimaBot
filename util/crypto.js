require('dotenv').config();
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = Buffer.from(process.env.SECRET_KEY.padEnd(32), 'utf-8');

function encrypt(text) {
    if(!text) return { iv: '', content: '' };
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    }
    
}

function decrypt(hash) {
    if(!hash || !hash.iv || !hash.content) return null;
    
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrypted.toString();
}

module.exports = {
    encrypt,
    decrypt
}