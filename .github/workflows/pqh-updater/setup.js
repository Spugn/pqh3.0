const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const core = require('@actions/core');

const DIRECTORY = Object.freeze({
    DATABASE: "",
});

run();
async function run() {
    const latest = await get_latest_version();
    const result = await download(latest);
    if (!result) {
        core.setFailed("failed to download database");
    }
}

function get_latest_version() {
    return new Promise(async (resolve) => {
        let latest = "";
        https.get('https://raw.githubusercontent.com/Expugn/priconne-database/master/version.json', (res) => {
            res.on('data', (chunk) => {
                latest += Buffer.from(chunk).toString();
            });
            res.on('end', () => {
                resolve(JSON.parse(latest));
            });
        });
    });
}

function download(latest) {
    return new Promise(async (resolve) => {
        await Promise.all([
            dl("cn"),
            dl("en"),
            dl("jp"),
            dl("kr"),
            dl("tw"),
            dl_manifest(),
        ]);
        resolve(
            fs.existsSync(path.join(DIRECTORY.DATABASE, `master_cn.db`)) &&
            fs.existsSync(path.join(DIRECTORY.DATABASE, `master_en.db`)) &&
            fs.existsSync(path.join(DIRECTORY.DATABASE, `master_jp.db`)) &&
            fs.existsSync(path.join(DIRECTORY.DATABASE, `master_kr.db`)) &&
            fs.existsSync(path.join(DIRECTORY.DATABASE, `master_tw.db`)) &&
            fs.existsSync(path.join(DIRECTORY.DATABASE, `manifest`))
        );
    });

    function dl(region = "jp") {
        return new Promise(async (resolve) => {
            const file = fs.createWriteStream(path.join(DIRECTORY.DATABASE, `master_${region}.db`));
            const url = `https://raw.githubusercontent.com/Expugn/priconne-database/master/master_${region}.db`;

            https.get(url, (res) => {
                const stream = res.pipe(file);
                stream.on('finish', () => {
                    console.log(`downloaded master_${region}.db from ${url}`);
                    resolve();
                });
            });
        });
    }

    function dl_manifest() {
        return new Promise(async (resolve) => {
            const manifest_path = await get_path(latest);
            let bundle = "";
            http.request({
                host: 'prd-priconne-redive.akamaized.net',
                path: `/dl/Resources/${latest.JP.version}/Jpn/AssetBundles/Windows/${manifest_path[0]}`,
                method: 'GET',
            }, (res) => {
                res.on('data', function(chunk) {
                    bundle += Buffer.from(chunk).toString();
                });
                res.on('end', () => {
                    bundle += '\n';
                    http.request({
                        host: 'prd-priconne-redive.akamaized.net',
                        path: `/dl/Resources/${latest.JP.version}/Jpn/AssetBundles/Windows/${manifest_path[1]}`,
                        method: 'GET',
                    }, (res) => {
                        res.on('data', function(chunk) {
                            bundle += Buffer.from(chunk).toString();
                        });
                        res.on('end', () => {
                            const file_path = path.join(DIRECTORY.DATABASE, 'manifest');
                            fs.writeFile(file_path, bundle, function (err) {
                                if (err) throw err;
                                console.log('DOWNLOADED ICON/UNIT MANIFEST ; SAVED AS', file_path);
                                resolve();
                            });
                        });
                    }).end();
                });
            }).end();
        });

        function get_path(latest) {
            return new Promise(async (resolve) => {
                let manifest_assetmanifest = "";
                http.get(`http://prd-priconne-redive.akamaized.net/dl/Resources/${latest.JP.version}/Jpn/AssetBundles/iOS/manifest/manifest_assetmanifest`, (res) => {
                    res.on('data', (chunk) => {
                        manifest_assetmanifest += Buffer.from(chunk).toString();
                    });
                    res.on('end', () => {
                        let res = [];
                        const b = manifest_assetmanifest.split('\n');
                        let results = b.filter((v) => /icon/.test(v)); // icon assetmanifest
                        res.push(results[0].split(',')[0]);
                        results = b.filter((v) => /unit/.test(v)); // unit assetmanifest
                        res.push(results[0].split(',')[0]);
                        resolve(res);
                    });
                });
            });
        }
    }
}