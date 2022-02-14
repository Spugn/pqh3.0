const fs = require('fs');
const path = require('path');
const https = require('https');
const brotli_decompress = require('brotli/decompress');

const DIRECTORY = Object.freeze({
    DATABASE: "./.github/workflows/pqh-updater/database",
});

// i don't know how to datamine CN server lol, stealing database from esterTion's API
checkDirectory(DIRECTORY.DATABASE);
const dbBrPath = path.join(DIRECTORY.DATABASE, `redive_cn.db.br`);
const dbPath = path.join(DIRECTORY.DATABASE, `redive_cn.db`);
const file = fs.createWriteStream(dbBrPath);
https.get('https://redive.estertion.win/db/redive_cn.db.br', function(response) {
    const stream = response.pipe(file);
    stream.on('finish', () => {
        fs.writeFile(dbPath, brotli_decompress(fs.readFileSync(dbBrPath)), function (err, data) {
            if (err) throw err;
            console.log(`DOWNLOADED AND DECOMPRESSED ${dbBrPath} ; SAVED AS ${dbPath}`);
        });
    });
});

/**
 * CHECK IF A DIRECTORY EXISTS, AND IF IT DOESN'T, CREATE IT
 * ALSO PROVIDES AN OPTION TO CLEAN THE DIRECTORY IF NECESSARY
 *
 * @param {String} directory    DIRECTORY PATH TO EVALUATE
 * @param {boolean} doClean     IF TRUE, CLEAN ALL FILES IN DIRECTORY
 */
 function checkDirectory(directory, doClean = false) {
    if (!directory) {
        return;
    }

    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }

    if (doClean) {
        clean(directory);
    }

    function clean(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                clean(path.join(dir, file));
                fs.rmdirSync(path.join(dir, file));
            }
            else {
                fs.unlinkSync(path.join(dir, file));
            }
        }
    }
}