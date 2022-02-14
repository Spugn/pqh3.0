const fs = require('fs');
const path = require('path');
const http = require('http');

// CONSTANTS
const DIRECTORY = Object.freeze({
    DATABASE: "./.github/workflows/pqh-updater/database",
});

// expecting a call like "node get_legacy_database.js <version>"
const version = process.argv.slice(2)[0];
const cdbPath = path.join(DIRECTORY.DATABASE, `master_${version}.cdb`);
checkDirectory(DIRECTORY.DATABASE);

console.log(`DOWNLOADING LEGACY DATABASE FOR ${version}...`);
let bundle = "";
http.request({
    host: 'prd-priconne-redive.akamaized.net',
    path: `/dl/Resources/${version}/Jpn/AssetBundles/Windows/manifest/masterdata_assetmanifest`,
    method: 'GET',
    }, (res) => {
        res.on('data', function(chunk) {
            bundle += Buffer.from(chunk).toString();
        });
        res.on('end', () => {
            const b = bundle.split(',');
            const hash = b[1];

            // DOWNLOAD FILE
            const file = fs.createWriteStream(cdbPath);
            http.get(`http://prd-priconne-redive.akamaized.net/dl/pool/AssetBundles/${hash.substring(0, 2)}/${hash}`, function(response) {
                const stream = response.pipe(file);
                stream.on('finish', () => {
                    console.log(`DOWNLOADED LEGACY DATABASE [${hash}] ; SAVED AS ${cdbPath}`);
                });
            });
        });
    }
).end();

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