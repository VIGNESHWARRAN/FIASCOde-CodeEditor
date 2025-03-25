const crypto = require('crypto');
const fs = require('fs').promises;

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

async function encryptFile(FilePath) {
    const filePath = `./${FilePath}`;
    const fileContent = await fs.readFile(filePath, 'utf8');
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(fileContent, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    await fs.writeFile(filePath, encrypted);
}

async function decryptFile(FilePath) {
    const filePath = `./${FilePath}`;
    const encryptedContent = await fs.readFile(filePath, 'utf8');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
module.exports = { encryptFile, decryptFile };