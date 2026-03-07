const fs = require('fs');
const path = require('path');
const os = require('os');

const dataFolder = path.join(os.homedir(), 'Documents', 'Sakura_SmartNotes');
if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder, { recursive: true });

const STORE = {
    get: (key, def) => {
        const filePath = path.join(dataFolder, `${key}.json`);
        if (fs.existsSync(filePath)) {
            try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) { return def; }
        } return def;
    },
    set: (key, val) => {
        const filePath = path.join(dataFolder, `${key}.json`);
        fs.writeFileSync(filePath, JSON.stringify(val, null, 2), 'utf8');
    }
};

module.exports = STORE;