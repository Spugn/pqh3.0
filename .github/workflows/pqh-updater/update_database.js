const fs = require('fs');
const path = require('path');
const http = require('http');
const core = require('@actions/core');

// CONSTANTS
const DIRECTORY = Object.freeze({
    DATABASE: "./.github/workflows/pqh-updater/database",
});
const FILES = Object.freeze({
    VERSION_FILE: path.join("public", "version"),
    CDB: path.join(DIRECTORY.DATABASE, "master.cdb"),
    MANIFEST: path.join(DIRECTORY.DATABASE, 'manifest'),
});
const SETTING = Object.freeze({
    DEFAULT_TRUTH_VERSION: 10010800,
    TEST_MAX: 20,
    TEST_MULTIPLIER: 10,
});

run();
function run() {
    // CHECK IF DATABASE DIRECTORY EXISTS
    checkDirectory(DIRECTORY.DATABASE);

    // READ CURRENT DATABASE VERSION
    let currentVersion;
    if (fs.existsSync(FILES.VERSION_FILE)) {
        const json = JSON.parse(fs.readFileSync(FILES.VERSION_FILE, 'utf8'));
        currentVersion = {
            truth_version: json.truth_version,
            hash: json.hash,
        };
        console.log(`EXISTING VERSION FILE FOUND: CURRENT TRUTH VERSION = ${currentVersion.truth_version}`);
    }
    else {
        // DATABSE VERSION FILE DOES NOT EXIST, START FROM SCRATCH
        currentVersion = {
            truth_version: SETTING.DEFAULT_TRUTH_VERSION,
            hash: "",
        };
        console.log(`VERSION FILE NOT FOUND. USING DEFAULT TRUTH VERSION: ${currentVersion.truth_version}`);
    }
    core.setOutput("init_truth_version", currentVersion.truth_version);

    // GET LATEST TRUTH VERSION
    console.log("CHECKING FOR DATABASE UPDATES...");
    let truthVersion = parseInt(currentVersion.truth_version);
    (async () => {
        function request(guess) {
            return new Promise((resolve) => {
                http.request({
                    host: 'prd-priconne-redive.akamaized.net',
                    path: `/dl/Resources/${guess}/Jpn/AssetBundles/iOS/manifest/manifest_assetmanifest`,
                    method: 'GET',
                }, (res) => {
                    resolve(res);
                }).end();
            });
        }

        // FIND THE NEW TRUTH VERSION
        for (let i = 1 ; i <= SETTING.TEST_MAX ; i++) {
            const guess = truthVersion + (i * SETTING.TEST_MULTIPLIER);
            console.log('[GUESS]'.padEnd(10), guess);
            const res = await request(guess);
            if (res.statusCode === 200) {
                console.log('[SUCCESS]'.padEnd(10), `${guess} RETURNED STATUS CODE 200 (VALID TRUTH VERSION)`);

                // RESET LOOP
                truthVersion = guess;
                i = 0;
            }
        }
    })().then(() => {
        console.log(`VERSION CHECK COMPLETE ; LATEST TRUTH VERSION = ${truthVersion}`);

        // CHECK IF LATEST TRUTH VERSION IS DIFFERENT FROM CURRENT
        if (truthVersion === currentVersion.truth_version) {
            console.log("NO UPDATE FOUND, MUST BE ON LATEST VERSION!");
            return;
        }

        // GET DATABASE HERE
        let bundle = "";
        http.request({
            host: 'prd-priconne-redive.akamaized.net',
            path: `/dl/Resources/${truthVersion}/Jpn/AssetBundles/Windows/manifest/masterdata_assetmanifest`,
            method: 'GET',
        }, (res) => {
            res.on('data', function(chunk) {
                bundle += Buffer.from(chunk).toString();
            });
            res.on('end', () => {
                const b = bundle.split(',');
                const hash = b[1];

                // COMPARE FILE HASHES
                if (currentVersion.hash === hash) {
                    console.log("DATABASE HASHES MATCH, NO UPDATE NEEDED");
                    return;
                }

                // UPDATE VERSION FILE
                currentVersion = {
                    truth_version: truthVersion,
                    hash,
                };
                fs.writeFile(FILES.VERSION_FILE, JSON.stringify(currentVersion), function (err) {
                    if (err) throw err;
                });

                // DOWNLOAD FILES
                downloadCDB(hash).then(() => {
                    downloadManifest().then(() => {
                        // DATABASE UPDATE COMPLETE
                        console.log('SUCCESSFULLY UPDATED DATABASE');
                        core.setOutput("success", true);
                        core.setOutput("truth_version", truthVersion);
                    });
                });
            });
        }).end();
    });

    function downloadCDB(hash) {
        // DOWNLOAD ENCRYPTED DATABASE AND DECRYPT IT WITH CONESHELL CALL
        return new Promise(async function(resolve) {
            const file = fs.createWriteStream(FILES.CDB);
            http.get(`http://prd-priconne-redive.akamaized.net/dl/pool/AssetBundles/${hash.substr(0, 2)}/${hash}`, function(response) {
                const stream = response.pipe(file);
                stream.on('finish', () => {
                    resolve();
                });
            });
        });
    }

    function downloadManifest() {
        // DOWNLOAD ICON AND UNIT ASSETMANIFEST AND SAVE THEM AS ONE FILE
        return new Promise(async function(resolve) {
            let bundle = '';
            http.request({
                host: 'prd-priconne-redive.akamaized.net',
                path: `/dl/Resources/${truthVersion}/Jpn/AssetBundles/Windows/manifest/icon2_assetmanifest`,
                method: 'GET',
            }, (res) => {
                res.on('data', function(chunk) {
                    bundle += Buffer.from(chunk).toString();
                });
                res.on('end', () => {
                    bundle += '\n';
                    http.request({
                        host: 'prd-priconne-redive.akamaized.net',
                        path: `/dl/Resources/${truthVersion}/Jpn/AssetBundles/Windows/manifest/unit2_assetmanifest`,
                        method: 'GET',
                    }, (res) => {
                        res.on('data', function(chunk) {
                            bundle += Buffer.from(chunk).toString();
                        });
                        res.on('end', () => {
                            fs.writeFile(FILES.MANIFEST, bundle, function (err) {
                                if (err) throw err;
                                console.log(`DOWNLOADED ICON AND UNIT MANIFEST ; SAVED AS ${FILES.MANIFEST}`);
                                resolve();
                            });
                        });
                    }).end();
                });
            }).end();
        });
    }
}

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