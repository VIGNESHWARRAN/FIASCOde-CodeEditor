const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlinkFile = promisify(fs.unlink);

async function writeCodeToFile(fileName, content) {
    await writeFile(fileName, content);
}

async function deleteFile(fileName) {
    try {
        await unlinkFile(fileName);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
}

module.exports = { writeCodeToFile, readFile, deleteFile };
