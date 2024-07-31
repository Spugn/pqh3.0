/**
 * pqh3.0-updater v3
 * for use with priconne-quest-helper 3.1
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const core = require('@actions/core');
const webp = require('webp-converter');

const DIRECTORY = Object.freeze({
    SETUP: `${__dirname}/setup`,
    DATA_OUTPUT: `${__dirname}/../../../src/lib/api`,
    IMAGE_OUTPUT: `${__dirname}/../../../static/images`,
    DATABASE: `${__dirname}/database`,
    DATA_DIRECTORY: `${__dirname}/../../../static/data`,
    PIE_RECIPE_OUTPUT: `${__dirname}/../../../pie.json`,
    DATABASE_KEYS: `${__dirname}/database_keys.json`,
});
const DICTIONARY = Object.freeze({
    EQUIPMENT: {
        FULL: "10",
        FRAGMENT: "11",
        BLUEPRINT: "12",
    },
    QUEST: {
        NORMAL: "11",
        HARD: "12",
        VERY_HARD: "13",
    }
});
const OTHER_REGIONS = Object.freeze(["CN", "EN", "KR", "TH", "TW"]);
const new_unity_change = true;

if (!fs.existsSync(DIRECTORY.DATABASE_KEYS)) {
    core.error("database keys not found");
    return;
}

const database_keys = JSON.parse(fs.readFileSync(DIRECTORY.DATABASE_KEYS, 'utf8'));

run();

async function run() {
    core.setOutput("success", false);
    check_directory(DIRECTORY.DATABASE, true);

    // get latest version
    const latest = await get_latest_version();

    // check updates
    const has_updates = await check_for_updates(latest);
    if (!has_updates) {
        return;
    }

    // download all dbs
    const downloaded = await download(latest);
    if (!downloaded) {
        core.error("missing database files, for some reason");
        return;
    }

    // setup
    check_directory(DIRECTORY.SETUP, true);
    let data = {
        character: {},
        equipment: {},
        quest: {},
    };
    const equipment_data = await write_equipment();
    data.equipment = equipment_data;
    const character_data = await write_character();
    data.character = character_data;
    let quest_data = await write_quest();
    quest_data = await write_event_quest(quest_data);
    data.quest = quest_data;
    await get_new_images(data);

    console.log("UPDATE COMPLETE!");
    write_file(path.join(DIRECTORY.DATA_OUTPUT, 'data.min.json'), data);

    check_directory(DIRECTORY.DATA_DIRECTORY);
    if (!fs.existsSync(path.join(DIRECTORY.DATA_DIRECTORY, 'README.md'))) {
        const text = "This directory is specifically intended to hold ***readable*** forms of the data used for this project.<br>\n"
            + "Any changes made to files here will not influence the project in any way.<br>\n"
            + "To make changes, modify the `data.min.json` file found in `src/lib/api/`."
        fs.writeFile(path.join(DIRECTORY.DATA_DIRECTORY, 'README.md'), text, async function (err) {
            if (err) throw err;
        });
    }
    write_file(path.join(DIRECTORY.DATA_DIRECTORY, 'data.json'), data, true);
    write_file(path.join(DIRECTORY.DATA_DIRECTORY, 'data.character.json'), data.character, true);
    write_file(path.join(DIRECTORY.DATA_DIRECTORY, 'data.equipment.json'), data.equipment, true);
    write_file(path.join(DIRECTORY.DATA_DIRECTORY, 'data.quest.json'), data.quest, true);
    write_file(path.join(DIRECTORY.DATA_DIRECTORY, 'version.json'), latest);
    core.setOutput("success", true);
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

function check_for_updates(latest) {
    return new Promise(async (resolve) => {
        const version_file = path.join(DIRECTORY.DATA_DIRECTORY, "version.json");
        if (fs.existsSync(version_file)) {
            const current = fs.readFileSync(version_file, 'utf8');
            console.log('[check_for_updates] EXISTING VERSION FILE FOUND!', current);
            if (current !== JSON.stringify(latest)) {
                console.log('[check_for_updates] UPDATES AVAILABLE!');
                resolve(true);
            } else {
                console.log('[check_for_updates] NO UPDATES AVAILABLE!');
                resolve(false);
            }
            return;
        }
        resolve(true);
    });
}

function download(latest) {
    return new Promise(async (resolve) => {
        await Promise.all([
            dl("cn"),
            dl("en"),
            dl("jp"),
            dl("kr"),
            dl("th"),
            dl("tw"),
            dl_manifest(),
        ]);
        resolve(
            fs.existsSync(path.join(DIRECTORY.DATABASE, `master_cn.db`)) &&
            fs.existsSync(path.join(DIRECTORY.DATABASE, `master_en.db`)) &&
            fs.existsSync(path.join(DIRECTORY.DATABASE, `master_jp.db`)) &&
            fs.existsSync(path.join(DIRECTORY.DATABASE, `master_kr.db`)) &&
            fs.existsSync(path.join(DIRECTORY.DATABASE, `master_th.db`)) &&
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
            // icon manifest
            http.request({
                host: 'prd-priconne-redive.akamaized.net',
                path: `/dl/Resources/${latest.JP.version}/Jpn/AssetBundles/iOS/${manifest_path[0]}`,
                method: 'GET',
            }, (res) => {
                res.on('data', function(chunk) {
                    bundle += Buffer.from(chunk).toString();
                });
                res.on('end', () => {
                    bundle += '\n';
                    // unit manifest
                    http.request({
                        host: 'prd-priconne-redive.akamaized.net',
                        path: `/dl/Resources/${latest.JP.version}/Jpn/AssetBundles/iOS/${manifest_path[1]}`,
                        method: 'GET',
                    }, (res) => {
                        res.on('data', function(chunk) {
                            bundle += Buffer.from(chunk).toString();
                        });
                        res.on('end', () => {
                            bundle += '\n';
                            // bg manifest
                            http.request({
                                host: 'prd-priconne-redive.akamaized.net',
                                path: `/dl/Resources/${latest.JP.version}/Jpn/AssetBundles/iOS/${manifest_path[2]}`,
                                method: 'GET',
                            }, (res) => {
                                res.on('data', function(chunk) {
                                    bundle += Buffer.from(chunk).toString();
                                });
                                res.on('end', () => {
                                    const file_path = path.join(DIRECTORY.DATABASE, 'manifest');
                                    fs.writeFile(file_path, bundle, function (err) {
                                        if (err) throw err;
                                        console.log('DOWNLOADED ICON/UNIT/BG MANIFEST ; SAVED AS', file_path);
                                        resolve();
                                    });
                                });
                            }).end();
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
                        let results = b.filter((v) => /manifest\/icon/.test(v)); // icon assetmanifest
                        res.push(results[0].split(',')[0]);
                        results = b.filter((v) => /manifest\/unit/.test(v)); // unit assetmanifest
                        res.push(results[0].split(',')[0]);
                        results = b.filter((v) => /manifest\/bg/.test(v)); // bg assetmanifest
                        res.push(results[0].split(',')[0]);
                        resolve(res);
                    });
                });
            });
        }
    }
}

function write_equipment() {
    /**
     * DATABASE NOTES
     *
     * equipment_data:
     *  COLUMNS: ids, names, descriptions, stats
     *  ROWS: full items/fragments/blueprints, first 2 values of ID determines type
     * quest_data:
     *  COLUMNS: names, stamina, clear_reward_group, rank_reward_group, wave_group_ids, reward_images
     *  ROWS: normal/hard/very_hard quests, first 2 values of ID determines difficulty
     * item_data:
     *  COLUMNS: names, descriptions, type
     *  ROWS: items, first 2 values of ID determines type
     * equipment_craft:
     *  COLUMNS: ids, condition_equipment (up to 10), consume_num ; currently uses up to condition_equipment_4 (item fragments + 3 other full items)
     *  ROWS: full items
     */
    return new Promise(async function(resolve) {
        let result, data = {};
        let db = await open({
            filename: path.join(DIRECTORY.DATABASE, 'master_jp.db'),
            driver: sqlite3.Database
        });

        // GET ALL EQUIPMENT DATA
        // result = await db.all('SELECT * FROM equipment_data');
        result = await db.all(`SELECT
            "${database_keys.equipment_data.equipment_id}" as equipment_id,
            "${database_keys.equipment_data.equipment_name}" as equipment_name
            FROM ${database_keys.equipment_data._table}`);
        result.forEach((row) => {
            const full_id = (row.equipment_id).toString(),  // 101011
                item_type = get_item_type(full_id),         // 10        (first 2 digits)
                item_id = get_item_id(full_id);             // 1011      (last 4 digits)
            if (item_type === DICTIONARY.EQUIPMENT.FULL) {
                data[full_id] = {
                    id: full_id,
                    name: {
                        JP: row.equipment_name
                    },
                    rarity: get_rarity_id(full_id),
                    fragment: {
                        id: "unknown",
                        name: {},
                    },
                    recipes: {
                        JP: {
                            required_pieces: 1,
                            required_items: [],
                            recipe_note: "JP"
                        }
                    },
                };
            }
            else {
                const is_fragment = item_type === DICTIONARY.EQUIPMENT.FRAGMENT;
                const is_blueprint = item_type === DICTIONARY.EQUIPMENT.BLUEPRINT;
                if (is_fragment || is_blueprint) {
                    data[`${DICTIONARY.EQUIPMENT.FULL}${item_id}`].fragment.id = full_id;
                    data[`${DICTIONARY.EQUIPMENT.FULL}${item_id}`].fragment.name["JP"] = row.equipment_name;
                }
            }
        });

        // GET CHARACTER MEMORY PIECES AVAILABLE FROM HARD AND VERY HARD QUESTS
        let memory_pieces = {};
        // result = await db.all('SELECT * FROM quest_data');
        result = await db.all(`SELECT
            "${database_keys.quest_data.quest_id}" as quest_id,
            "${database_keys.quest_data.reward_image_1}" as reward_image_1
            FROM ${database_keys.quest_data._table}`);
        result.forEach((row) => {
            const quest_id = (row.quest_id).toString(),
                quest_type = quest_id.substring(0, 2);
            if (quest_type === DICTIONARY.QUEST.HARD
                || quest_type === DICTIONARY.QUEST.VERY_HARD) {

                if (row.reward_image_1 !== 0) {
                    memory_pieces[`${row.reward_image_1}`] = true;
                }
            }
        });

        // GET CHARACTER MEMORY PIECES AVAILABLE FROM EVENT QUESTS
        // result = await db.all('SELECT * FROM shiori_quest');
        result = await db.all(`SELECT
            "${database_keys.shiori_quest.drop_reward_id}" as drop_reward_id
            FROM ${database_keys.shiori_quest._table}`);
        result.forEach((row) => {
            if (row.drop_reward_id !== 0) {
                memory_pieces[`${row.drop_reward_id}`] = true;
            }
        });

        // ADD MEMORY PIECES TO EQUIPMENT DATA
        // result = await db.all('SELECT * FROM item_data');
        result = await db.all(`SELECT
            "${database_keys.item_data.item_id}" as item_id,
            "${database_keys.item_data.item_name}" as item_name,
            "${database_keys.item_data.item_type}" as item_type
            FROM ${database_keys.item_data._table}`);
        result.forEach((row) => {
            if (row.item_type === 11        // MEMORY PIECE
                || row.item_type === 18) {  // PURE MEMORY PIECE

                const item_id = (row.item_id).toString();
                if (memory_pieces[item_id]) {
                    data[`${item_id}`] = {
                        id: item_id,
                        name: {
                            JP: row.item_name
                        },
                        rarity: "99",
                        fragment: {
                            id: "unknown",
                            name: {},
                        },
                        recipes: {
                            JP: {
                                required_pieces: 1,
                                required_items: [],
                                recipe_note: "JP"
                            }
                        },
                    };
                }
            }
        });

        // ADD JAPANESE RECIPE
        // result = await db.all('SELECT * FROM equipment_craft');
        result = await db.all(`SELECT
            "${database_keys.equipment_craft.equipment_id}" as equipment_id,
            "${database_keys.equipment_craft.condition_equipment_id_1}" as condition_equipment_id_1,
            "${database_keys.equipment_craft.consume_num_1}" as consume_num_1,
            "${database_keys.equipment_craft.condition_equipment_id_2}" as condition_equipment_id_2,
            "${database_keys.equipment_craft.condition_equipment_id_3}" as condition_equipment_id_3,
            "${database_keys.equipment_craft.condition_equipment_id_4}" as condition_equipment_id_4,
            "${database_keys.equipment_craft.condition_equipment_id_5}" as condition_equipment_id_5,
            "${database_keys.equipment_craft.condition_equipment_id_6}" as condition_equipment_id_6,
            "${database_keys.equipment_craft.condition_equipment_id_7}" as condition_equipment_id_7,
            "${database_keys.equipment_craft.condition_equipment_id_8}" as condition_equipment_id_8,
            "${database_keys.equipment_craft.condition_equipment_id_9}" as condition_equipment_id_9,
            "${database_keys.equipment_craft.condition_equipment_id_10}" as condition_equipment_id_10
            FROM ${database_keys.equipment_craft._table}`);
        result.forEach((row) => {
            const equip_id = row.equipment_id;
            if (get_item_type(equip_id) !== DICTIONARY.EQUIPMENT.FULL) {
                // EQUIPMENT CRAFT DATA IS NOT FOR A FULL ITEM
                return;
            }

            let recipe = data[`${equip_id}`].recipes.JP;

            // CHECK IF condition_equipment_id_1 IS THE SAME AS EQUIPMENT ID
            if (get_item_id(equip_id) === get_item_id(row.condition_equipment_id_1)) {
                recipe.required_pieces = row.consume_num_1;
            }
            else {
                // IF condition_equipment_id_1 DOES NOT MATCH EQUIPMENT ID, MEANS THERE ARE NO FRAGMENTS
                // SET condition_equipment_id_1 AS A REQUIRED ITEM INSTEAD
                // THIS IS MAINLY USED FOR THE ITEM "Sorcerer's Glasses"
                recipe.required_pieces = 0;
                recipe.required_items.push(`${row.condition_equipment_id_1}`);
            }

            // GO THROUGH ALL OTHER CONDITION_EQUIPMENT_x (UP TO 10)
            for (let i = 2; i <= 10; i++) {
                if (row[`condition_equipment_id_${i}`] === 0) {
                    break;
                }
                recipe.required_items.push(`${row[`condition_equipment_id_${i}`]}`);
            }
        });

        // CLEAN UP current DATABASE
        // ADD REGIONAL DATA
        for (const region of OTHER_REGIONS) {
            db.close();
            db = await open({
                filename: path.join(DIRECTORY.DATABASE, `master_${region.toLowerCase()}.db`),
                driver: sqlite3.Database
            });

            // ADD REGIONAL NAME
            if ([].includes(region)) {
                // v4 obfuscation
                result = await db.all(`SELECT
                    "7610913be1dcd5177b91b00e624f7a691ad7d06e7d840c26302c464292c3e4cb" as equipment_id,
                    "a6749b724440442eac0678ffae1fc892890b5e6dd5bbd60f7f07b7d8904d318c" as equipment_name
                    FROM v1_2352e872250b0dd60da9256c53ae6c8b4973dd66ee0e7a41e8862989f76fc3ff`);
            } else if ([].includes(region)) {
                // v3 obfuscation
                result = await db.all(`SELECT
                    "dc99181d770f91ae59ec3cba995e814cadf64edd62542564c66e159a7674e953" as equipment_id,
                    "1b6d20b4349c752aa0f5ef99c468f4316ca4ed197a6788b6bd7e5ec1003a0523" as equipment_name
                    FROM v1_394ec464e163fcb400fcde78cc4888c3693a9576b8ca4e15a9103ded1ad5888c`);
            } else if ([].includes(region)) {
                // v2 obfuscation
                result = await db.all(`SELECT
                    "84b3dd3ea4ca92f592961fb0798c63c4ef784f4cc5b5a163baecd267a22c38e0" as equipment_id,
                    "0d6fd061913e48be364da345b1ff21306c5e445ec78f22e558322394db899670" as equipment_name
                    FROM v1_d65c3cc9733623f0bac516331b5826f94b173b99fecd3dd6c6286c139aef70bd`);
            } else if (["TW", "KR"].includes(region)) {
                // v1 obfuscation
                result = await db.all(`SELECT
                    "117b0f03dced2b67f095ebc64a9e457e748ad48c29d05adf93c9973680910c80" as equipment_id,
                    "75c6439b5ed7ca28c9c0fb19fc1e6988f0de438248b1012abf2b250559bcad3e" as equipment_name
                    FROM v1_083ad81204aa4a8c48ca5634bc5edb02b89dc9067c8c86549346d01e6d8c52de`);
            } else {
                result = await db.all('SELECT * FROM equipment_data');
            }
            result.forEach((row) => {
                const full_id = (row.equipment_id).toString(),  // 101011
                    item_type = get_item_type(full_id),         // 10        (first 2 digits)
                    item_id = get_item_id(full_id);             // 1011      (last 4 digits)
                if (item_type === DICTIONARY.EQUIPMENT.FULL) {
                    data[full_id].name[region] = row.equipment_name;
                }
                else {
                    const is_fragment = item_type === DICTIONARY.EQUIPMENT.FRAGMENT;
                    const is_blueprint = item_type === DICTIONARY.EQUIPMENT.BLUEPRINT;
                    if (is_fragment || is_blueprint) {
                        data[`${DICTIONARY.EQUIPMENT.FULL}${item_id}`].fragment.name[region] = row.equipment_name;
                    }
                }
            });

            // GET MEMORY PIECE NAMES
            if ([].includes(region)) {
                // v4 obfuscation
                result = await db.all(`SELECT
                    "ba34c16f7b59d8211c0ea6f0ddcb9451be26f57b1b27a3ed6810d9af218ddc90" as item_id,
                    "d37a505953cdd2cba6ddbf32de35cda63abef37e7f7fba95716ec41fb8f8c015" as item_name,
                    "ef6f510eef19a9971aab7d45a9789e9cb13049d1505f8c2d87df5b038cac7786" as item_type
                    FROM v1_19da1c39bd0fbad1bab6fcb49665d3661ca7266903db5b1f3e4f921b537986dc`);
            } else if ([].includes(region)) {
                // v3 obfuscation
                result = await db.all(`SELECT
                    "fe851c13918b5ca78dbd84e2c7da7dfa954776251efdffd5eabeb69a2d9bf549" as item_id,
                    "24d88ac3fd57a0b8465eae1855ba60690f7098fedf9b5f0f4f17d55587465aef" as item_name,
                    "1bd3930021670e55d114a5890f3e6666ee8628430c7b61148897df8337567c43" as item_type
                    FROM v1_b73012ab56dde90ac740b11a9f8a4081f8d2542e339ab0532db7767e653d5a5a`);
            } else if ([].includes(region)) {
                // v2 obfuscation
                result = await db.all(`SELECT
                    "02407971b30435ddb8ac8720af83695aabe3e14c87a63b5d16c78b1a29229197" as item_id,
                    "b7d066f106136056d8cd569cff7d97702219ca91e0e64fc4706c626619c6aa22" as item_name,
                    "9a31f2ee58a2e2081e72e0414a53d032300135092bd5c0197bf78f3ffd26ec17" as item_type
                    FROM v1_54c8b972655bc2bab6f1259903c6b619cbaeaf79c440d7bde75f8d337ea8e747`);
            } else if (["TW", "KR"].includes(region)) {
                // v1 obfuscation
                result = await db.all(`SELECT
                    "993210ad729a5b7b9fc8824808ca79aba005377696ddd4090beed7a8b33f086a" as item_id,
                    "b4cbd9557674c9f93d9971e1b4bacc2d83c0b6c7429046845fd420329d16c04f" as item_name,
                    "f0c2615f3f1b52e2e6f9fb4d37a78fa1682e4e458d4ced1b450d3f3c026f1718" as item_type
                    FROM v1_0ed9943e72fc03f39c3ef3d8e5c8a62549bbce7de2b1974489742cd9701efe11`);
            } else {
                result = await db.all('SELECT * FROM item_data');
            }
            result.forEach((row) => {
                const memory_piece = data[`${row.item_id}`];
                if (!memory_piece) {
                    return;
                }
                memory_piece.name[region] = row.item_name;
            });

            // GET REGIONAL RECIPE
            if ([].includes(region)) {
                // v4 obfuscation
                result = await db.all(`SELECT
                    "7d4bff76d19988c631aa9a0446b9f66b453ecea332f701bb07b4e432b00fbddd" as equipment_id,
                    "35dd53fba47ce24c57813f3382e3bcf6f55152f2afd8920dcdadcb6b6c46e811" as condition_equipment_id_1,
                    "9c6c89e71d38b6f5871fe696437703af75d9787f09a280e83e88024c7c48cfa2" as consume_num_1,
                    "b72de5c846803856673117d99bf0017a60c012786f7452e095c664ebcada0690" as condition_equipment_id_2,
                    "0430f2940f61a7be78477847ed41d0d20a194a3fc2f235a2c23d99929342a883" as condition_equipment_id_3,
                    "89bb436923041b88ace27d47a0a34e0e5ba7224f3775a188bddd64b857ae0527" as condition_equipment_id_4,
                    "3647bcff2ebafd9cce7b19b9525671fd71c070060d5ae375f275370f66ce281c" as condition_equipment_id_5,
                    "3753f342b7e6c918fa26e53887b625e9b8ff55d1c4bd56fe352c33fab0a2d5ae" as condition_equipment_id_6,
                    "f764a6bb54249fee771f1d3d3479203d4050fa1dabbe5fcde79c73bdf272d337" as condition_equipment_id_7,
                    "4cb9d3692a90e544969222f5905d9a80112e9a99e0e5f8d92b1fcd820a03b4b0" as condition_equipment_id_8,
                    "766eaee68c6f0956c33acafb42b3547db35cdd27d3add90ccf547695710a288c" as condition_equipment_id_9,
                    "9852bfac3089289e7478b2c99e1eaf234cb381b5e68602c6fa70fe036c983a0b" as condition_equipment_id_10
                    FROM v1_da731a5e2245c5b6d02d466a1c117e9a1dd23053c2c8e60b39ec25e37f398bd8`);
            } else if ([].includes(region)) {
                // v3 obfuscation
                result = await db.all(`SELECT
                    "3213eb9ddfc34097dc0f6d8dce0e5faa8a1ee3d754ffff9edb038210d37b0211" as equipment_id,
                    "cd457258037d3d920c5a25e140aadec7b4f91e8ed0e8ed3a8a9aabed52389c7d" as condition_equipment_id_1,
                    "97679c1e2c1ff594fe7b6e8079f893844b07ea4940e191cf30dfe9bf4668a905" as consume_num_1,
                    "806bd7537ff00bf09f4f71c7e8b34c3c9db2deff9406c1bebbaa54c19eba658c" as condition_equipment_id_2,
                    "5eed0d11c25ad176c5617f8fd46b9a4024bc81714906277e6d63467e23a4e958" as condition_equipment_id_3,
                    "bfde765432a021b8d651f6b2859a349314afc3ae0e87c9d681c3f40227df5348" as condition_equipment_id_4,
                    "dedc4b2d8a8f6fd5eb6767e9435904f8e00db157ebda6adc1060cfbd0d804aca" as condition_equipment_id_5,
                    "2ae1d4b8d5c3929c04eceb144ffe1e958cb3ac566188e07a56d2d6c2baa7cbae" as condition_equipment_id_6,
                    "f27b221cfd1ac091faeeb49900cfb77cd68e010f8f44aadcb2fd7387f766d3bf" as condition_equipment_id_7,
                    "98b41869812cdfc4f49758cc2032ebd58f5d77a0cc4616eb33c5f346d322bbc9" as condition_equipment_id_8,
                    "82de91c17c0b364daa528b4966ad6924818d0fd5f5f69ad41bee1a7172758b00" as condition_equipment_id_9,
                    "f1c1999cceb5d99c99c54b8871aebecadfe75b503a77319fe3dd2a053d31dbd2" as condition_equipment_id_10
                    FROM v1_a7b880db37daa647fc9d0ade3c3be743ef6aa082c4b8f5520c091465e3d3b719`);
            } else if ([].includes(region)) {
                // v2 obfuscation
                result = await db.all(`SELECT
                    "31944ef6a38ab7c4dcadc257a6c24da5bf716d40f87271b99e1ec3e989eaa940" as equipment_id,
                    "6150ea072f0151707e5190fc3b2be7ad46bd4613842e433a156ac2f41dbe8dbe" as condition_equipment_id_1,
                    "3ebe66a84e4ed917291beea05b029af3175cef631d125492383e8e2972ede424" as consume_num_1,
                    "8bb2cfca3501d08e54339f0f98b1a36d12e16aa9232b6217d5a093586d4eb9e4" as condition_equipment_id_2,
                    "614a8f32df83a318ed82620dc116c35cda05bbac1f8221eaca935ed1f783b0e8" as condition_equipment_id_3,
                    "27a460347f86267186162ce21b5e7aed98d00fec6ab557d6a67cd19b7d454f54" as condition_equipment_id_4,
                    "56f3acb3d134f2749c8728d3ffe0f17693bec8cd2f95d3c574dea41715fbdd17" as condition_equipment_id_5,
                    "1440da987f69e352b72b404e3d80ce4006666b12789299d97d0cff587774c9b1" as condition_equipment_id_6,
                    "115edfe8dc7d88b57f10fb7251e5e28087e7aaa604643b0557d1a92fd09b2cc6" as condition_equipment_id_7,
                    "890d2e8795384a19f5abfbc57a2e2cc68214ba2bf1e21be14f7668b6d4dd5205" as condition_equipment_id_8,
                    "aee0b1e411e4e6c13ba532bd52b31779dcb972a6089ac9ea06fb7fbb6e5b4f41" as condition_equipment_id_9,
                    "08e0822f14098bd041975f43f9f187647393f9debb55b6baa4a5b7dbfffb7a06" as condition_equipment_id_10
                    FROM v1_ee00719358a5873ca8ac1277e6b229c226027aa42adbbb96a003731c2cf9089c`);
            } else if (["TW", "KR"].includes(region)) {
                // v1 obfuscation
                result = await db.all(`SELECT
                    "f05d2c56cf858e5ecd0e4411a34abc8dbd9d4234864304021ef43adc5ab8c48a" as equipment_id,
                    "af908dfb77e40ce2bcee817d928d56b9af99f4507f139512529f654487b41441" as condition_equipment_id_1,
                    "430b2c1ab094580fc896801738de9343f82876f00c899c320603331a68472522" as consume_num_1,
                    "1143128db6b324325faf0560c83eddcf4d92a9aa488ed920939b530e9eb39bd6" as condition_equipment_id_2,
                    "83f24dcde59e2043aeeef0ab1aba24550573a74f8a7e95df24453b31ce9dbc96" as condition_equipment_id_3,
                    "d7657e4210e5d275d5d98c6ba392414fe0bc087b38b36ad6056647c7009127b1" as condition_equipment_id_4,
                    "ca7ce0de7e38d0e5ae0eb81e6557e52bc112124cea4a6f66cc0a7d34bcedf474" as condition_equipment_id_5,
                    "c9943b8ab792aaba410b94563be687bc2f76a0acf6929cb385e9bd4945049d83" as condition_equipment_id_6,
                    "060f3b54258f39f4674539b8b22c7fb346530c16ead37a6c30d905e7de4f46b2" as condition_equipment_id_7,
                    "fe183cf061a7ee28d1b3ccac6f5cd0832bffd1524aa5fa250805f91a844098f3" as condition_equipment_id_8,
                    "4e6cdefe4a0954e8fca9144915da283ba14bc25c7140615a09fb0f1a53de3c75" as condition_equipment_id_9,
                    "11d035f1151460d3163c2a839e34593efb3f5c1291797556a73ff63ee3fa92a5" as condition_equipment_id_10
                    FROM v1_002b61c4e8da5d368b8e3ce110cee277bc3bd0ba44745e67c30574cdebb9bd60`);
            } else {
                result = await db.all('SELECT * FROM equipment_craft');
            }
            result.forEach((row) => {
                const equip_id = row.equipment_id;
                let recipe = {
                    required_pieces: 1,
                    required_items: [],
                    recipe_note: `${region}`
                };
                if (get_item_type(equip_id) !== DICTIONARY.EQUIPMENT.FULL) {
                    // EQUIPMENT CRAFT DATA IS NOT FOR A FULL ITEM
                    return;
                }

                // CHECK IF condition_equipment_id_1 IS THE SAME AS EQUIPMENT ID
                if (get_item_id(equip_id) === get_item_id(row.condition_equipment_id_1)) {
                    recipe.required_pieces = row.consume_num_1;
                }
                else {
                    // IF condition_equipment_id_1 DOES NOT MATCH EQUIPMENT ID, MEANS THERE ARE NO FRAGMENTS
                    // SET condition_equipment_id_1 AS A REQUIRED ITEM INSTEAD
                    // THIS IS MAINLY USED FOR THE ITEM "Sorcerer's Glasses"
                    recipe.required_pieces = 0;
                    recipe.required_items.push(`${row.condition_equipment_id_1}`);
                }

                // GO THROUGH ALL OTHER CONDITION_EQUIPMENT_x (UP TO 10)
                for (let i = 2; i <= 10; i++) {
                    if (row[`condition_equipment_id_${i}`] === 0) {
                        break;
                    }
                    recipe.required_items.push(`${row[`condition_equipment_id_${i}`]}`);
                }

                // ADD LEGACY RECIPE TO EQUIPMENT DATA
                data[`${equip_id}`].recipes[region] = recipe;
            });
        }

        // FINISH
        db.close().finally(() => {
            resolve(data);
        });
    });

    function get_item_type(full_id) {
        return `${full_id}`.substring(0, 2);
    }

    function get_rarity_id(full_id) {
        if (full_id > 10000000) {
            // IDS CAN BE AS LONG AS `equipment_10000000`, TAKE THE 3RD AND 4TH DIGIT AND ADD 10 AND CONVERT THE RESULT TO STRING
            // `equipment_[10 (TYPE)][0 (RARITY)][00000 (ITEM ID)]`
            // ASSUMING FUTURE EQUIPMENTS WILL BE `equipment_1001####` -> `equipment_1002####` -> ...
            return `${parseInt(`${full_id}`.substring(2, 3)) + 10}`;
        }
        return `${full_id}`.substring(2, 3);
    }

    function get_item_id(full_id) {
        return `${full_id}`.substring(2);
    }
}

function write_character() {
    /**
     * DATABASE NOTES
     *
     * unit_data:
     *  COLUMNS: ids, names, base rarity, stats
     *  ROWS: playable characters and story/npc ones, unit_id above 190,000 are NPCs or story units
     * unit_promotion:
     *  COLUMNS: unit id, promotion level, equip slots (x6)
     *  ROWS: playable characters and story/npc ones, unit_id above 190,000 are NPCs or story units
     */
    return new Promise(async function(resolve) {
        let result, data = {};
        let db = await open({
            filename: path.join(DIRECTORY.DATABASE, 'master_jp.db'),
            driver: sqlite3.Database
        });

        // GET ALL PLAYABLE CHARACTERS WITH unit_id < 190,000
        // result = await db.all('SELECT * FROM unit_data WHERE unit_id < 190000');
        result = await db.all(`SELECT
            "${database_keys.unit_data.unit_id}" as unit_id,
            "${database_keys.unit_data.unit_name}" as unit_name
            FROM ${database_keys.unit_data._table}
            WHERE unit_id < 190000`);
        result.forEach((row) => {
            data[`${row.unit_id}`] = {
                id: `${row.unit_id}`,
                name: {
                    JP: row.unit_name
                },
                equipment: {},
            };
        });

        // GET UNIT PROMOTION REQUIREMENTS FOR unit_id < 190,000
        // result = await db.all('SELECT * FROM unit_promotion WHERE unit_id < 190000');
        result = await db.all(`SELECT
            "${database_keys.unit_promotion.unit_id}" as unit_id,
            "${database_keys.unit_promotion.promotion_level}" as promotion_level,
            "${database_keys.unit_promotion.equip_slot_1}" as equip_slot_1,
            "${database_keys.unit_promotion.equip_slot_2}" as equip_slot_2,
            "${database_keys.unit_promotion.equip_slot_3}" as equip_slot_3,
            "${database_keys.unit_promotion.equip_slot_4}" as equip_slot_4,
            "${database_keys.unit_promotion.equip_slot_5}" as equip_slot_5,
            "${database_keys.unit_promotion.equip_slot_6}" as equip_slot_6
            FROM ${database_keys.unit_promotion._table}
            WHERE unit_id < 190000`);
        result.forEach((row) => {
            if (!data[`${row.unit_id}`]) {
                return;
            }
            data[`${row.unit_id}`].equipment[`rank_${row.promotion_level}`] = [
                `${row.equip_slot_1 === 999999 ? "unknown" : row.equip_slot_1}`,
                `${row.equip_slot_2 === 999999 ? "unknown" : row.equip_slot_2}`,
                `${row.equip_slot_3 === 999999 ? "unknown" : row.equip_slot_3}`,
                `${row.equip_slot_4 === 999999 ? "unknown" : row.equip_slot_4}`,
                `${row.equip_slot_5 === 999999 ? "unknown" : row.equip_slot_5}`,
                `${row.equip_slot_6 === 999999 ? "unknown" : row.equip_slot_6}`
            ];
        });

        // PURGE UNITS WITH NO EQUIPMENT
        // UNITS LIKE ONES NOT IMPLEMENTED (split units from duo/trio) CAN EXIST
        purge_no_equips();

        // REGION LIMITED CHARACTERS?
        console.log("SEARCHING FOR REGION LIMITED CHARACTERS...");
        for (const region of OTHER_REGIONS) {
            db.close();
            db = await open({
                filename: path.join(DIRECTORY.DATABASE, `master_${region.toLowerCase()}.db`),
                driver: sqlite3.Database
            });

            if ([].includes(region)) {
                // v4 obfuscation
                result = await db.all(`SELECT
                    "a403a2b9766fceb5d9b1ae053dc90c4fd02c9a0b1164109cd083a22f025a520d" as unit_id,
                    "1674283c1055620962cdf653640f71f10296f0f9d8eb73ea89ead55e5c2979d9" as unit_name
                    FROM v1_e2a69483c615a820ec2d577d131a69cf62020c0525821852285198c118cfe9fa
                    WHERE unit_id < 190000`);
            } else if ([].includes(region)) {
                // v3 obfuscation
                result = await db.all(`SELECT
                    "6c03560acfaf8fddc36a4c92c4e6e73dd29be1665eff17b88caab66f6a9ccffb" as unit_id,
                    "e0e16de67e49d0d87865c4a8f5235e8c953b603febd721b45cb955a17447e46d" as unit_name
                    FROM v1_6eeffabbe4fa93418f5d0fccfe79cad2b540b7f12598d2d3721274a2716a9433
                    WHERE "6c03560acfaf8fddc36a4c92c4e6e73dd29be1665eff17b88caab66f6a9ccffb" < 190000`);
            } else if ([].includes(region)) {
                // v2 obfuscation
                result = await db.all(`SELECT
                    "783ed63a9964b6fbf27cf40684139bafdfd4e6dc1529c0a08e4b7e20e03c85cd" as unit_id,
                    "6c9b14792df9f66ddc7e251edf579f096cfd0982c8f301f5db5f70389cfc1dad" as unit_name
                    FROM v1_c634df482cdc1dfa51ab922b541610f4e22659f48be60c9f88bc246ec44137e3
                    WHERE "783ed63a9964b6fbf27cf40684139bafdfd4e6dc1529c0a08e4b7e20e03c85cd" < 190000`);
            } else if (["TW", "KR"].includes(region)) {
                // v1 obfuscation
                result = await db.all(`SELECT
                    "d6b5352a2780d85233a5077f80b0d680d2d2f1a357efe1dc7482fe9783e009a1" as unit_id,
                    "e11c46da2b701622247a88c464406d7dea16f7c33f10ed7777453750fcf28d08" as unit_name
                    FROM v1_92fec1a41887606642d5ac246c109fc1cc9808b1a637e85ed8bbcd553756b07f
                    WHERE "d6b5352a2780d85233a5077f80b0d680d2d2f1a357efe1dc7482fe9783e009a1" < 190000`);
            } else {
                result = await db.all('SELECT * FROM unit_data WHERE unit_id < 190000');
            }
            result.forEach((row) => {
                if (data[`${row.unit_id}`]) {
                    // add regional name to name
                    data[`${row.unit_id}`].name[region] = row.unit_name;
                    return;
                }
                console.log(`REGION LIMITED CHARACTER FOUND? (${region}) ${row.unit_id} - ${row.unit_name}`);
                data[`${row.unit_id}`] = {
                    id: `${row.unit_id}`,
                    name: {
                        JP: row.unit_name,
                        [region]: row.unit_name
                    },
                    equipment: {},
                };
            });

            if ([].includes(region)) {
                // v4 obfuscation
                result = await db.all(`SELECT
                    "80d4d7d76e04e3656ab0dacbca672f49641e96b49d68d05fbb8bb025bab39782" as unit_id,
                    "f967258d4adb53ec8bc4c50f1139f3c1a1e50fa09c9b7639185a7109a95607f6" as promotion_level,
                    "40210b3751b1655a1ae703565496c4df86f973879eda7cc6a1f64fb738c27f01" as equip_slot_1,
                    "593ec9fd0ec1f5d827cf7f90f52b6e52c96220b18285d5f882a7315553e6b954" as equip_slot_2,
                    "638f56ea332b62ca88713a3e6e01a6c7bb71f8ace796c107865b32769cc4bc45" as equip_slot_3,
                    "9d2a82f591e69d80cb810fe9bb7a00cdeb2202f4e7be693afba3bd9f27a0d286" as equip_slot_4,
                    "3dad599f20aa7e40a510cd7c164c70bed0a640af6e8cffb218dbaf78bcf87e13" as equip_slot_5,
                    "d018836130f0e2c69a1b950da4a3bf7248d88469603aa2d383fbb05bee5c1b66" as equip_slot_6
                    FROM v1_f247da5fe73982d39d426b794dba1f4dd2e983014794bcfc79b37c695b17a330
                    WHERE unit_id < 190000`);
            } else if ([].includes(region)) {
                // v3 obfuscation
                result = await db.all(`SELECT
                    "10a86ced4a5eaaae13fdee4f0c7b5df64bb76f4ec8c13cfbe18d66ca4dd84efc" as unit_id,
                    "a47e7ef8ec7c8dfd19a99ed7a065a5516464ba472abf0b55f2d2bb4fd5937785" as promotion_level,
                    "977eed23ac318a16e47fa69538a917d9aa7054a0ed4471e664f06f7efeddf799" as equip_slot_1,
                    "4790841f6d7543681f8eddefb45be233b7214316d21ea786e4f02559b9759eee" as equip_slot_2,
                    "7698c6dac8b115ec12c96b47fa3352a46b2046e0026bf70792a4873bc89c860a" as equip_slot_3,
                    "0b1c55138680262d112b639ab02112c1ca2f367c09e0312b84a1e7cc8abb5f1e" as equip_slot_4,
                    "b5c2c448b3ce079362c107a4fc1295a91d3331cda853d87f411fe58212b78940" as equip_slot_5,
                    "4e4e56f4b8df01293c5e3909c8ba4fc830ae2fbd80e3bcf9e78a71279262703a" as equip_slot_6
                    FROM v1_e9fdfbda611b89703fe6582990e27dfb1aa14478793ad6f911126d5a71107bc3
                    WHERE "10a86ced4a5eaaae13fdee4f0c7b5df64bb76f4ec8c13cfbe18d66ca4dd84efc" < 190000`);
            } else if ([].includes(region)) {
                // v2 obfuscation
                result = await db.all(`SELECT
                    "de2b83a08ad7d784924a880a30ca49d7edae16749609c1c7af1e4d025794132f" as unit_id,
                    "ef3bb4409377eecf5a8b429b7a1cd57f7ade48f353eb289e46f884e3b6aeeb6e" as promotion_level,
                    "922f705db0318733ced777a22d4fadc135ffc1bf81ebd1f13711a6c6b92e259f" as equip_slot_1,
                    "41b0c14e4ca4158b0f56a92afe25a2772954e7854bf5170b81231500862fe4af" as equip_slot_2,
                    "a92df7bb37ca3bb419b8cf7866c268198e18fe0ab19198a343cce2fc4a525840" as equip_slot_3,
                    "13ba40253367c2c7515f6ad08286951444dfbab5ceb314a7d7efa4a36a187c28" as equip_slot_4,
                    "243ff2af8f1bc8cab4c34b4ba78b14f82ceac20f1a03451e587a9933a0458fc4" as equip_slot_5,
                    "b6d5b4a7e5f6069c7ec3939288bfe91ad2c51bc2d429741b07f3c08e990e1af7" as equip_slot_6
                    FROM v1_ded589f3508585295fb5d8f21c39f636819819d41301ac779b58643a3a722cbb
                    WHERE "de2b83a08ad7d784924a880a30ca49d7edae16749609c1c7af1e4d025794132f" < 190000`);
            } else if (["TW", "KR"].includes((region))) {
                // v1 obfuscation
                result = await db.all(`SELECT
                    "12d73c57a39d9d27c7a4af0d0314fcf085f310b156db89ce2c50573d6854ff71" as unit_id,
                    "bb66cebd6236536435a1a8e4658ed0096d14b1e4ee7e90bd52b14def775e3ecf" as promotion_level,
                    "2d09359ad0638bd7e130bef872086208519ec360d728fb10010125f9c3c3878d" as equip_slot_1,
                    "20dbfe9ee8946c34eaad90a47ba6764a5eae545c5d621afb7d168203975dd70b" as equip_slot_2,
                    "786d2e2bf652a199eae0b454ab0507c91c1f8cf6845837a52fd2d6e0aeef385f" as equip_slot_3,
                    "ef17207a8ae1429f1b0685d94b8d073f56468ea0474ab8bbfc6b24d600ca53e8" as equip_slot_4,
                    "f8f4db9794a199fcf82aad0b410fd7ef9dae7939756283d5a1ecb3ab033d000e" as equip_slot_5,
                    "cfccb04af93e9015e9e974b68549a85629f999bf2205ce0941d15518ea9be039" as equip_slot_6
                    FROM v1_2e98e1112682328288566d0bd2bb62a02b4524873c7cf62a2529409431dbbb35
                    WHERE "12d73c57a39d9d27c7a4af0d0314fcf085f310b156db89ce2c50573d6854ff71" < 190000`);
            } else {
                result = await db.all('SELECT * FROM unit_promotion WHERE unit_id < 190000');
            }
            result.forEach((row) => {
                if (!data[`${row.unit_id}`]) {
                    return;
                }
                if (data[`${row.unit_id}`].equipment[`rank_${row.promotion_level}`]) {
                    return;
                }
                // console.log(`ADDING REGION LIMITED CHARACTER EQUIPS FOR ${row.unit_id} RANK ${row.promotion_level}`);
                data[`${row.unit_id}`].equipment[`rank_${row.promotion_level}`] = [
                    `${row.equip_slot_1 === 999999 ? "unknown" : row.equip_slot_1}`,
                    `${row.equip_slot_2 === 999999 ? "unknown" : row.equip_slot_2}`,
                    `${row.equip_slot_3 === 999999 ? "unknown" : row.equip_slot_3}`,
                    `${row.equip_slot_4 === 999999 ? "unknown" : row.equip_slot_4}`,
                    `${row.equip_slot_5 === 999999 ? "unknown" : row.equip_slot_5}`,
                    `${row.equip_slot_6 === 999999 ? "unknown" : row.equip_slot_6}`
                ];
            });
        }

        purge_no_equips();

        // FINISH
        db.close().finally(() => {
            resolve(data);
        });

        function purge_no_equips() {
            for (const key in data) {
                if (Object.keys(data[key].equipment).length === 0) {
                    delete data[key];
                }
            }
        }
    });
}

function write_quest() {
    /**
     * DATABASE NOTES
     *
     * quest_data:
     *  COLUMNS: ids, names, stamina, clear_reward_group, rank_reward_group (seems to be 211001000 for all quests, 30 gems for first clear?), wave_group_id_(1-3)
     *  ROWS: normal, hard, very hard, and some other random quest type; focus on quest_id < 14,000,000
     * wave_group_data:
     *  COLUMNS: id, wave_group_id, odds (all 100?), drop_reward_id_(1-5)
     *  ROWS: ids, probably not special? idk.
     * enemy_reward_data:
     *  COLUMNS: drop_reward_id (not important?), drop_count (all 1, not important?), reward_type_(1-5), reward_id_(1-5), odds_(1-5)
     */
    return new Promise(async function(resolve) {
        let result, data = {};
        let quest_data = {}, wave_group_data = {}, enemy_reward_data = {};

        for (const region of ["JP", ...OTHER_REGIONS]) {
            let db = await open({
                filename: path.join(DIRECTORY.DATABASE, `master_${region.toLowerCase()}.db`),
                driver: sqlite3.Database
            });

            // GET ALL QUESTS WITH quest_id < 14,000,000
            if (["JP"].includes(region)) {
                // whatever latest version JP obfuscation is
                result = await db.all(`SELECT
                    "${database_keys.quest_data.quest_id}" as quest_id,
                    "${database_keys.quest_data.quest_name}" as quest_name,
                    "${database_keys.quest_data.stamina}" as stamina,
                    "${database_keys.quest_data.clear_reward_group}" as clear_reward_group,
                    "${database_keys.quest_data.rank_reward_group}" as rank_reward_group,
                    "${database_keys.quest_data.wave_group_id_1}" as wave_group_id_1,
                    "${database_keys.quest_data.wave_group_id_2}" as wave_group_id_2,
                    "${database_keys.quest_data.wave_group_id_3}" as wave_group_id_3
                    FROM ${database_keys.quest_data._table}
                    WHERE quest_id < 14000000`);
            } else if ([].includes(region)) {
                // v4 obfuscation
                result = await db.all(`SELECT
                    "ffa736951a17e4449d8c32a8edc125a65b09b6fc78cb4132b19d88392d7b2b36" as quest_id,
                    "b47a88f1c9a3b2887531e7ea8b1c7b33fff1b8ca3e11caff43630373fadff505" as quest_name,
                    "fa0562438be15ed64ec58cbcd1da250cb33f5a20eb5da094d2da4fca3e36c0e3" as stamina,
                    "15e3e172be93a38b02428628f1ad4e7017827058f70588f05e115d437532dba2" as clear_reward_group,
                    "cec9732387ef8642db9a4174188c7252dda2153181afbcdadaef0e8a3263f7d1" as rank_reward_group,
                    "b07d95a994efbf91a1ae985b43bd6dfca81a8010be202bf8dd66dd1cc8d9ae5f" as wave_group_id_1,
                    "0a2e2713a80cfc13918994c29902784d4b274aa0da6f01c5f1462a58c2e6ea06" as wave_group_id_2,
                    "9f612a1703e4c5e8212a46798291bb0b132e30fb4078e4a6bbe53f574f3fc3f3" as wave_group_id_3
                    FROM v1_71caf11836bb429791703811ec703e5368ec26a56e1f0fde343fe09c3890467b
                    WHERE quest_id < 14000000`);
            } else if ([].includes(region)) {
                // v3 obfuscation
                result = await db.all(`SELECT
                    "7af2919f02dcb2c6e282c73be7d025b29e52e88ba89284eeac3ab82fcf58f897" as quest_id,
                    "b0c2fee1f33f83bad4c1644cc445b1d814c2b6e2e26cedddb0f6be3f24800ec8" as quest_name,
                    "a7bcfe305e46a065b9f57496b0e4f90c965f3c7192902f370bceb5afad7eac1a" as stamina,
                    "eefe9500bec58099a16099fd32ae006b254ff414dfea9675c87d64311ca543c8" as clear_reward_group,
                    "6ccc556637d74090c8742a82c64374a5938f8a01705efcb969c39ea9f5fbf259" as rank_reward_group,
                    "113efca4fa3989177110857071151d64631efccc372dddd87370106ca0f76e40" as wave_group_id_1,
                    "a74de8c27a945360354ab54d1ea2de45e355c40a2c7808a8ce600d098d303f47" as wave_group_id_2,
                    "da2480a52c3b590015f9d7400bde286146200b8a0aea285cdb45afd38b5e727f" as wave_group_id_3
                    FROM v1_96a36e87cfa53a8eb892e42b0fd6f6e8b287da53c4ea8a81e0f632afe1eaa8e3
                    WHERE "7af2919f02dcb2c6e282c73be7d025b29e52e88ba89284eeac3ab82fcf58f897" < 14000000`);
            } else if ([].includes(region)) {
                // v2 obfuscation
                result = await db.all(`SELECT
                    "79ec733e128d9f8475e465408b6fedb1eddfac69543efe4a45e8cec2b62ff0bf" as quest_id,
                    "2ca5957ee58276f042f524289ddf62cb075d57f8dbc4b815495aa82f932424cf" as quest_name,
                    "e84aaf893cc7eac13d45c6e42aeae5be808b397bc08bb8f477b41e2c337cd4a9" as stamina,
                    "55be6681c27c1d334a0086842b1a27a83834e55ec4890f8d99b9665fbe5a1781" as clear_reward_group,
                    "de20e30741e628807d40ce8e39a3c817f3dfa6a8228d77b3d72eb2196bf5f8ab" as rank_reward_group,
                    "264b46633e33af9075515626fc9881aa4beb2ef7f8a053959e01dc9b63060142" as wave_group_id_1,
                    "1956e7e334b4f5f943881ca4897afcc00aa0fdd3f463adf326863bb8855d874e" as wave_group_id_2,
                    "6eeaac508437aad33e4f606018ab97002568fbcfa7aab181cbc87c83cef148f0" as wave_group_id_3
                    FROM v1_c862b668c7528703f868f52c293de9a8f69262f379763672a740ddd6a7ee0cbe
                    WHERE "79ec733e128d9f8475e465408b6fedb1eddfac69543efe4a45e8cec2b62ff0bf" < 14000000`);
            } else if (["TW", "KR"].includes(region)) {
                // v1 obfuscation
                result = await db.all(`SELECT
                    "1839b5b47535dafc3e83b013174ea6de1b71c20ab270054605b9479ca14892c7" as quest_id,
                    "fbee8fc0d3ff386954dc352ffaee10b8fc8196a138af9ca0cb41a3356b7c7621" as quest_name,
                    "0f050dc44f113f5b17c279a7cb54da912fde601d788f96cf89c00edd2a81009f" as stamina,
                    "aed45aa78e15b8f73269d8e30f2a289be9d54e6b0ed2c77aac2ca75f9e270aee" as clear_reward_group,
                    "798c624394c6d9c1479f6df839701e5d6bde3765ec7059302fca9b829d07f4f0" as rank_reward_group,
                    "29dc73cc5076213b19ee63372eff4a2fedc8e356c6efb74c567726221f64e79b" as wave_group_id_1,
                    "a04bb61b4b71d0a0ebc3e52d31dce55d0bf54a9f3450d6531987215768a76c46" as wave_group_id_2,
                    "9fc479f62ea634d248a8712186c4942bf5e6b116d501537e4462f5f7ca56752f" as wave_group_id_3
                    FROM v1_44c40227050196c418afee6bb66bfc7a991242f03509a6da081ca925311d6d23
                    WHERE "1839b5b47535dafc3e83b013174ea6de1b71c20ab270054605b9479ca14892c7" < 14000000`);
            } else {
                result = await db.all('SELECT * FROM quest_data WHERE quest_id < 14000000');
            }
            result.forEach((row) => {
                const name = row.quest_name,
                    _trimmed_name = name.split(' ').pop().trim(),
                    chapter = _trimmed_name.substring(0, _trimmed_name.indexOf('-')),
                    number = _trimmed_name.substring(_trimmed_name.indexOf('-') + 1),
                    type = (`${row.quest_id}`).substring(0, 2);
                let difficulty;
                switch(type) {
                    case DICTIONARY.QUEST.NORMAL:
                        difficulty = "";
                        break;
                    case DICTIONARY.QUEST.HARD:
                        difficulty = "H";
                        break;
                    case DICTIONARY.QUEST.VERY_HARD:
                        difficulty = "VH";
                        break;
                    default:
                        difficulty = "???";
                }
                quest_data[`${row.quest_id}`] = {
                    id: `${row.quest_id}`,
                    name: name,
                    stamina: row.stamina,
                    key: `${chapter}-${number}${difficulty}`,
                    difficulty: difficulty,
                    clear_reward_group: row.clear_reward_group, // first clear bonus
                    rank_reward_group: row.rank_reward_group,   // 30gems for first clear?
                    wave_group_id_1: row.wave_group_id_1,
                    wave_group_id_2: row.wave_group_id_2,
                    wave_group_id_3: row.wave_group_id_3,
                };
            });

            // COLLECT wave_group_data INFORMATION
            if (["JP"].includes(region)) {
                // whatever latest version JP obfuscation is
                result = await db.all(`SELECT
                    "${database_keys.wave_group_data.wave_group_id}" as wave_group_id,
                    "${database_keys.wave_group_data.drop_reward_id_1}" as drop_reward_id_1,
                    "${database_keys.wave_group_data.drop_reward_id_2}" as drop_reward_id_2,
                    "${database_keys.wave_group_data.drop_reward_id_3}" as drop_reward_id_3,
                    "${database_keys.wave_group_data.drop_reward_id_4}" as drop_reward_id_4,
                    "${database_keys.wave_group_data.drop_reward_id_5}" as drop_reward_id_5
                    FROM ${database_keys.wave_group_data._table}`);
            } else if ([].includes(region)) {
                // v4 obfuscation
                result = await db.all(`SELECT
                    "8f7332e43ff5dd8a98bdfbc4c9c19f104a953c468e7abd05e30bbddb141b7a13" as wave_group_id,
                    "b1056471e34ff85d57ac4355ed2938aad47607c3a6b226d8822575cf21d7cfc9" as drop_reward_id_1,
                    "a937120e15d6d1f21485cf375435305b5a3dd6bf90bb2477df4bf84c61d60c3a" as drop_reward_id_2,
                    "9b3d68da292019ac71300a1ffded710d3f5af45fcade62cbc5c4161bbbab0295" as drop_reward_id_3,
                    "6c108c11c6b8d5d52174fda6c1910656096cb6e0723b5b154e04474c06d0cf9e" as drop_reward_id_4,
                    "11abeb2c272789ead785dcac88140ca622eff727757781444303755927781f76" as drop_reward_id_5
                    FROM v1_a86bef1fd995db2a6b2e1b6f3298836c9d8eecfc4f52d77035bb289941668d2f`);
            } else if ([].includes(region)) {
                // v3 obfuscation
                result = await db.all(`SELECT
                    "ed2d71d9abac2884bf8173e8232a39ed32912314ec185f8487e85794563b048c" as wave_group_id,
                    "3f6749762df8ef6f194c91779b725f743c10134f423ebdc20a86f103b2c541a1" as drop_reward_id_1,
                    "41bf9245a6e7a9e42a2689e6bdd7989683484efc4c1631dc1670a479f6a918a4" as drop_reward_id_2,
                    "c199645132cd4e8b26ded43468f0c05d699283b6cde5b3a5498c1c00b626df2d" as drop_reward_id_3,
                    "e8d93aa62fd0599044769c06879eeb99139b14308f06bb21de32eb0c4783f66f" as drop_reward_id_4,
                    "ce7c3bef53b7f4a2aacd38b1ff3f309ceaede2ceeeb7432e2284325d227d5c7f" as drop_reward_id_5
                    FROM v1_3458b77f1411acf2d5b9a7908490d1f9edc87c3d07c66f54664e670b98deea1d`);
            } else if ([].includes(region)) {
                // v2 obfuscation
                result = await db.all(`SELECT
                    "7d28db7531e01f826299aaa0429b18125195cb504f4cc1bd04345be4d41fe1c2" as wave_group_id,
                    "3f1a282c5a6f308313303aed51f1732897651318609159e120cf76c8ac01e7db" as drop_reward_id_1,
                    "53839c5a79661c1551146b008cbae3d08e71d993d0654ff58e56ec0d48022650" as drop_reward_id_2,
                    "c5d4fedffe3460f0ca2300bb2e91eaf2b39f8faa39b7c9cde5d544b368201502" as drop_reward_id_3,
                    "b8d843eeb7e6c8bab6294a479db3ed4b99869ca642819dc638220c18d69f62c6" as drop_reward_id_4,
                    "d3953f7076132fe5570cc3c4efd550ebdf17c5720990144dc59e9dabbf7818a8" as drop_reward_id_5
                    FROM v1_ca8fdf1829dcda86ce6eafac8b12ce4b3f8959c318861a5a1dffc10644cadc17`);
            } else if (["TW", "KR"].includes(region)) {
                // v1 obfuscation
                result = await db.all(`SELECT
                    "5214d4f345605f85246bb9c84e149c38074e0a231f349a68b661fd332daf6f18" as wave_group_id,
                    "e3515d334da06748fa6eb3b5bb0d61cbb0243d141bbaaa5bd818b5d251bf39be" as drop_reward_id_1,
                    "7a39f9a7ce315314ebc2b03dde369642fb52d0eb03bdbf585ea457fe4721dd2f" as drop_reward_id_2,
                    "30b2f06ab1e920ea1379047a4748acf09270c715eaeaccb1e9e1b8c0f8fcd08f" as drop_reward_id_3,
                    "8db6ac020c008696e94b8e86c3230dc51a2b897c9e027861744f3a9afd8ac242" as drop_reward_id_4,
                    "424b38b443a6ade30b5dc0bc29621fb61bb8d85e4722260e04d515703f553e06" as drop_reward_id_5
                    FROM v1_9f731bded5fadb8013b67a2ba1d33ffbbcef8361af39701da01fc080a1801cde`);
            } else {
                result = await db.all('SELECT * FROM wave_group_data');
            }
            result.forEach((row) => {
                wave_group_data[`${row.wave_group_id}`] = {
                    id: `${row.wave_group_id}`,
                    drop_reward_id_1: row.drop_reward_id_1,
                    drop_reward_id_2: row.drop_reward_id_2,
                    drop_reward_id_3: row.drop_reward_id_3,
                    drop_reward_id_4: row.drop_reward_id_4,
                    drop_reward_id_5: row.drop_reward_id_5,
                };
            });

            // COLLECT enemy_reward_data INFORMATION
            if (["JP"].includes(region)) {
                // whatever latest version JP obfuscation is
                result = await db.all(`SELECT
                    "${database_keys.enemy_reward_data.drop_reward_id}" as drop_reward_id,
                    "${database_keys.enemy_reward_data.reward_type_1}" as reward_type_1,
                    "${database_keys.enemy_reward_data.reward_id_1}" as reward_id_1,
                    "${database_keys.enemy_reward_data.odds_1}" as odds_1,
                    "${database_keys.enemy_reward_data.reward_type_2}" as reward_type_2,
                    "${database_keys.enemy_reward_data.reward_id_2}" as reward_id_2,
                    "${database_keys.enemy_reward_data.odds_2}" as odds_2,
                    "${database_keys.enemy_reward_data.reward_type_3}" as reward_type_3,
                    "${database_keys.enemy_reward_data.reward_id_3}" as reward_id_3,
                    "${database_keys.enemy_reward_data.odds_3}" as odds_3,
                    "${database_keys.enemy_reward_data.reward_type_4}" as reward_type_4,
                    "${database_keys.enemy_reward_data.reward_id_4}" as reward_id_4,
                    "${database_keys.enemy_reward_data.odds_4}" as odds_4,
                    "${database_keys.enemy_reward_data.reward_type_5}" as reward_type_5,
                    "${database_keys.enemy_reward_data.reward_id_5}" as reward_id_5,
                    "${database_keys.enemy_reward_data.odds_5}" as odds_5
                    FROM ${database_keys.enemy_reward_data._table}`);
            } else if ([].includes(region)) {
                // obfuscation v4
                result = await db.all(`SELECT
                    "fcb8479287443d603c414108710cecd08371019aa531a120d8e061948377136a" as drop_reward_id,
                    "fdcafde1c845dc9650fbb7d3aee86a375c1d9eb0eee07e7b3c4588b31006022a" as reward_type_1,
                    "435b4f6331d4cd42027fbb8007f2aa457fc49489864167703b2db6cb3c215133" as reward_id_1,
                    "012471462ae53b7db0090604aaa5433f04cded2f9596b582f417ac990bca6a92" as odds_1,
                    "f00f840150a3e6b237a739a5c28e551cd9de020c941f2f65facf33baae9ede5a" as reward_type_2,
                    "5ff2fc535ba82bfca08c44dd1fde5e3bbb55e0bf18638efb5aedbff8f5c8ffb4" as reward_id_2,
                    "cead5ad3df09b616d145b04906e1aff0708062f95ac9adbb37c864ecb0fa4f1e" as odds_2,
                    "c77e238c46e5c30e8e014b321f00bbad25282226dccb726b48a20164b4a85507" as reward_type_3,
                    "3249cdef8e0a6c4584901d8397d8d0d475a2cb7bb6e31f4ae662d9f1e94a573e" as reward_id_3,
                    "0177035b5688e9331ca04fa8b0753773b67d7fa52e70d04fc0e9e936248303b0" as odds_3,
                    "9a382d91b5dd99243a3c9d5ea93280e3d329378851d5e41d084bf88003bd7125" as reward_type_4,
                    "015c3e8afbf795a6f4fdd7e94aeae8dd2a79c56416e104f0bbbb4f1c701f2b59" as reward_id_4,
                    "e7fc39ffc33fa61512b7edee2d16f8ce6928976c1618302c72a828242f998262" as odds_4,
                    "658924943bc5a96f3f6f38af1b650fcd5819ee8cdc23ff7debb107b8117ce61f" as reward_type_5,
                    "a3ea560a76b57a47115e2340a03e4870fd8a38c27a6a5cb1e6714a5bceb7d47a" as reward_id_5,
                    "8254eadae085448dd46b09f9a40e92be68cc622f09e62d9b516f531623503bce" as odds_5
                    FROM v1_be57a2da93a1268907befe6a04e9579de0c5b15a0f22339a69773a38619462fd`);
            } else if ([].includes(region)) {
                // obfuscation v3
                result = await db.all(`SELECT
                    "6814b4f5aa6f35db518293341dab7f9f4c7ef9f3c496efc0bff3acd3d25f0595" as drop_reward_id,
                    "ad1b74ed48ca982ad27e40c82316b1ac59a56510a8ec422a9779bc660f8b6bf7" as reward_type_1,
                    "cdcc7d0573a920c86a2eb06249c957660810c651ca8fcb578bddf9087651fbb9" as reward_id_1,
                    "fd3c51bb2dc4f1da4812bb80e998a0138565652480e2ee016b44a7801a9e7132" as odds_1,
                    "6083fa349837f54126941ae21f9674d7ebc9f332ea8e078acb0e11af66741dcd" as reward_type_2,
                    "1ba4e1c4ba32d469b0b57292b4a0a4c07a36f2345ea8ad3db4aa89b724a8452a" as reward_id_2,
                    "2bd5536b6cbabd86c8a82219b3feb840bb14feda6fcd87b7f93b87b66b8d4a09" as odds_2,
                    "fab756703be37d787d6c66845ffd44b551889531222e68ee2d00df6ca4307542" as reward_type_3,
                    "25153d0b7a63498a3e15d731c149fd6839cadafa16d3f6a1b217ff11989c61c3" as reward_id_3,
                    "2df4a619339552b72bb8ffebe35bf5202517e2639b5dda42618f7973db903715" as odds_3,
                    "daed69e1a5beef1845cc16494481b162b21b90ca0f9b571a02bf40fc2ddaedcd" as reward_type_4,
                    "f080206339f338e07763d79fe81024a37d55702d5b400ec5690dd73b74897f62" as reward_id_4,
                    "a11f9faeea09d617d7dc7961026ac487b3e92978e193350bc1fb957128e1713f" as odds_4,
                    "7fb6ed38fce88b9bb615f7bdda813d634fec24ab372e1ccb5246dc2fc2c2403e" as reward_type_5,
                    "a66061d638bd37d6c16e29bb61a78bf814f8efa3b368eb535e10ff1fe4a58b40" as reward_id_5,
                    "d4eebef3885066df0f501d1989a74081de65808aa29251abcc44896633ca5a7f" as odds_5
                    FROM v1_6287575e611096c4d8554153a0da87d8cae85ba5b1b9812a3f69244ba3fe0395`);
            } else if ([].includes(region)) {
                // obfuscation v2
                result = await db.all(`SELECT
                    "90f543e79ef03699a30de5cc016e37cd5fbee47715c07ac3230969ca4a2ffe1b" as drop_reward_id,
                    "86df563a035dc17d4900414734e61cba5b8c62cbb4ff614e2028d6ab2ebb9ec8" as reward_type_1,
                    "475e9a327852f7cf903c2a1d5e1c7d832e567bd2fc5935abb34e954258244d8c" as reward_id_1,
                    "a7a86ffcc7633abedee79feff4892cc6f11a62e07679bf372ae9c8ecbe610eec" as odds_1,
                    "55d804a7f3e51bc648873f2dec1e958abecfd863d8a0bce08b51b43a725a5a00" as reward_type_2,
                    "a657f1206c0622e214c49380c23f1faaa8e2baac61d7fb72251c4794f9690fea" as reward_id_2,
                    "e38e82e6fd0729878cee920c8ee5a47b6b5d21e538ed6fbcc3753d4842dadeaf" as odds_2,
                    "7e095828543a3fe6901b4a99d15a12a73d41ad6d7f26509030aa691ca40313a3" as reward_type_3,
                    "23436d49aa10fec5fa2089ce7afe5804c2541b9780655959bdc50f7dfe633ea4" as reward_id_3,
                    "e0f758e48835142cbfd4e34fa2e8a5a42cf15da33025655cd1d3752d1a424a19" as odds_3,
                    "736a3eec6354921b1e0a93c4618cab8aceb77148b517aa5ad9699c8154ba63d0" as reward_type_4,
                    "0c46378aaa83ae02b143516a2d30ef565616d2efa127c8eed245cbdc8c3c4b1d" as reward_id_4,
                    "2ed08d25b8e4d0b1e4675c26b7b69225429d12bfe2a0513cee2076e5eb27f8b1" as odds_4,
                    "d2e2e94e4223f2f5efee30f6793f09282d048cf8142466c7f9fe2c4950dc468c" as reward_type_5,
                    "c35fd528e5eef0935338518be6b3327803a9996305afd00f3241f760f0889da9" as reward_id_5,
                    "5cab241005ade7b5a531d68a551be10c2156671a06eaaceaf96843a7f618d240" as odds_5
                    FROM v1_8a5e26966c0f98ccf0ec230ec358f054d3d48ccfbf25e4006db91f7c8ed3a026`);
            } else if (["TW", "KR"].includes(region)) {
                // obfuscation v1
                result = await db.all(`SELECT
                    "144e6109a07897650ee2d4f82951073cbc7c2972765e760347800fcecbe85932" as drop_reward_id,
                    "3d23e9855d259107047329379a1496c18cdb4c3ac87709547ec13bf35a11abfe" as reward_type_1,
                    "b97a3ace517c8b30a801a7e999b30288aa787c9bcb4b5bd90a51c52ea4caa703" as reward_id_1,
                    "097218f1cfaa2ae43b50b4b4464f2688a5bd3b9c652ce03f5b4e0b5404cc0bf8" as odds_1,
                    "65587dbce88fe9313c2e5b3500f73a22ed175def4f599acd337571224aa77365" as reward_type_2,
                    "444d8363dc9f933849d0bcf241c6698cf8de2443063589afe0a8c60f5b1022b6" as reward_id_2,
                    "8e7c60992229514d83dd51342554e60c808d065242f6800ec2e971bbfcfc223b" as odds_2,
                    "f2767fb09d1b3a0a11a4dc7eb8e9355464c0f274faef1ea514e97de574880fb0" as reward_type_3,
                    "9eda2fb438faad5eeb6230f17bafd29980ef9cf0d0bd15c3e6632082d5b1bbaa" as reward_id_3,
                    "93272d6bfcd95e9e858bd5b4818555b5200bb734ba6823857555db04e8243c23" as odds_3,
                    "f901a86f350bb8db5fa0ddd50442f04c9256288adc3631f3f8f544550543114d" as reward_type_4,
                    "a7ce2633e6256cc50d3ba7a58b71b5d34add0920b83b1dd0d3b91693a0b3614d" as reward_id_4,
                    "5941c1850c2a2c148988da56e19340a6b37ae62013ad061d94ff8513a7c30b1b" as odds_4,
                    "25ae9299d864170ee0d3183e45e3a3c3abc19adbf1ad7b6005cba1938af73244" as reward_type_5,
                    "92bcb4a8cc15d140aaab4605119bf87ca02b452d025943d06ecc963a3b5e5824" as reward_id_5,
                    "555f4be25ba200f32f37853cd08a39d83f237bc9c3406287b1e99f1d65fece16" as odds_5
                    FROM v1_7bbe5e8eb686aa33799ae695f6d73cc50fbf0c09d977c0717d00c174e08ba2f0`);
            } else {
                result = await db.all('SELECT * FROM enemy_reward_data');
            }
            result.forEach((row) => {
                enemy_reward_data[`${row.drop_reward_id}`] = {
                    drop_reward_id: `${row.drop_reward_id}`,
                    reward_type_1: row.reward_type_1,
                    reward_id_1: row.reward_id_1,
                    odds_1: row.odds_1,
                    reward_type_2: row.reward_type_2,
                    reward_id_2: row.reward_id_2,
                    odds_2: row.odds_2,
                    reward_type_3: row.reward_type_3,
                    reward_id_3: row.reward_id_3,
                    odds_3: row.odds_3,
                    reward_type_4: row.reward_type_4,
                    reward_id_4: row.reward_id_4,
                    odds_4: row.odds_4,
                    reward_type_5: row.reward_type_5,
                    reward_id_5: row.reward_id_5,
                    odds_5: row.odds_5,
                };
            });

            // COMPILE QUEST DATA
            for (const key in quest_data) {
                const quest = quest_data[key];

                // CHECK IF QUEST HAS ALL WAVE DATA
                // QUESTS THAT DON'T HAVE ALL WAVE DATA CAN EXIST, SPECIFICALLY IN VERY HARD QUESTS THAT AREN'T ADDED YET
                if (quest.wave_group_id_1 === 0
                    || quest.wave_group_id_2 === 0
                    || quest.wave_group_id_3 === 0) {

                    // QUEST ISN'T COMPLETED
                    continue;
                }

                if (quest.difficulty !== "") {
                    // QUEST IS NOT NORMAL DIFFICULTY
                    continue;
                }

                add_quest_entry(quest, region);

                // CHECK IF ANY MORE NORMAL QUESTS
                const id = quest.id.toString(),
                    number = id.substring(id.length - 3),
                    chapter = id.substring(id.length - 6, id.length - 3),
                    next_number = (parseInt(number) + 1).toString().padStart(3, '0'),
                    next_id = `11${chapter}${next_number}`;
                if (quest_data.hasOwnProperty(next_id)) {
                    continue;
                }

                // ADD HARD QUESTS HERE
                let hard_quest_counter = 1,
                    hard_id = `12${chapter}${hard_quest_counter.toString().padStart(3, '0')}`,
                    hard_quest;
                while (quest_data.hasOwnProperty(hard_id)) {
                    hard_quest = quest_data[hard_id];
                    if (hard_quest.wave_group_id_1 !== 0
                        && hard_quest.wave_group_id_2 !== 0
                        && hard_quest.wave_group_id_3 !== 0) {

                        add_quest_entry(hard_quest, region);
                    }
                    hard_quest_counter++;
                    hard_id = `12${chapter}${hard_quest_counter.toString().padStart(3, '0')}`;
                }

                // ADD VERY HARD QUESTS HERE
                hard_quest_counter = 1;
                hard_id = `13${chapter}${hard_quest_counter.toString().padStart(3, '0')}`;
                while (quest_data.hasOwnProperty(hard_id)) {
                    hard_quest = quest_data[hard_id];
                    if (hard_quest.wave_group_id_1 !== 0
                        && hard_quest.wave_group_id_2 !== 0
                        && hard_quest.wave_group_id_3 !== 0) {

                        add_quest_entry(hard_quest, region);
                    }
                    hard_quest_counter++;
                    hard_id = `13${chapter}${hard_quest_counter.toString().padStart(3, '0')}`;
                }
            }

            // FINISH
            db.close();
            quest_data = {}, wave_group_data = {}, enemy_reward_data = {};
        }
        resolve(data);

        function get_quest_drops(data, wave_group) {
            if (!wave_group) {
                console.log("wave group isn't available for some reason, skip");
                return data;
            }
            if (!data.memory_piece) {
                data.memory_piece = {
                    item: "unknown",
                    drop_rate: 0,
                };
            }
            if (!data.drops) {
                data.drops = [];
            }
            if (!data.subdrops) {
                data.subdrops = [];
            }
            let drop_reward_counter = 1;
            while (drop_reward_counter <= 5) {
                // WAVE DROPS
                const wave_drops = wave_group[`drop_reward_id_${drop_reward_counter}`];
                if (wave_drops === 0) {
                    // ITEM DOES NOT EXIST, CONTINUE...
                    drop_reward_counter++;
                    continue;
                }

                // GET ITEMS FROM WAVE DROPS
                const enemy_reward = enemy_reward_data[`${wave_drops}`];
                if (enemy_reward.reward_id_1 !== 0
                    && enemy_reward.reward_id_2 !== 0
                    && enemy_reward.reward_id_3 !== 0
                    && enemy_reward.reward_id_4 !== 0
                    && enemy_reward.reward_id_5 !== 0) {
                    // WAVE GIVES SUBDROPS
                    data.subdrops = [
                        {
                            item: `${enemy_reward.reward_id_1}`,
                            drop_rate: enemy_reward.odds_1,
                        },
                        {
                            item: `${enemy_reward.reward_id_2}`,
                            drop_rate: enemy_reward.odds_2,
                        },
                        {
                            item: `${enemy_reward.reward_id_3}`,
                            drop_rate: enemy_reward.odds_3,
                        },
                        {
                            item: `${enemy_reward.reward_id_4}`,
                            drop_rate: enemy_reward.odds_4,
                        },
                        {
                            item: `${enemy_reward.reward_id_5}`,
                            drop_rate: enemy_reward.odds_5,
                        }
                    ];
                }
                else if (enemy_reward.reward_id_1 !== 0
                    && enemy_reward.reward_id_2 !== 0
                    && enemy_reward.reward_id_3 !== 0
                    && enemy_reward.reward_id_4 === 0
                    && enemy_reward.reward_id_5 === 0) {
                    // WAVE GIVES SUBDROPS_2 (3 ACCESSORIES, ADDED CHAPTER 64+)
                    data.subdrops_2 = [
                        {
                            item: `${enemy_reward.reward_id_1}`,
                            drop_rate: enemy_reward.odds_1,
                        },
                        {
                            item: `${enemy_reward.reward_id_2}`,
                            drop_rate: enemy_reward.odds_2,
                        },
                        {
                            item: `${enemy_reward.reward_id_3}`,
                            drop_rate: enemy_reward.odds_3,
                        },
                    ];
                }
                else {
                    let enemy_reward_counter = 1;
                    while (enemy_reward_counter <= 5) {
                        const type = enemy_reward[`reward_type_${enemy_reward_counter}`],
                            id = enemy_reward[`reward_id_${enemy_reward_counter}`],
                            odds = enemy_reward[`odds_${enemy_reward_counter}`],
                            item = {
                                item: `${id}`,
                                drop_rate: odds,
                            };
                        if (id === 0) {
                            // RAN OUT OF ITEMS, GUESS WE CAN LEAVE THE LOOP?
                            break;
                        }

                        if (type === 4) {
                            // DROP IS AN EQUIPMENT
                            data.drops.push(item);
                        }
                        else if (type === 2 && id.toString().substring(0, 1) === '3') {
                            // DROP IS AN ITEM AND IS A MEMORY PIECE
                            data.memory_piece = item;
                        }
                        enemy_reward_counter++;
                    }
                }
                drop_reward_counter++;
            }
            return data;
        }

        function add_quest_entry(quest, region = "JP") {
            // GET QUEST DROPS
            if (!wave_group_data[quest.wave_group_id_1]) {
                // wave group 1 doesn't exist for some reason, skip this quest entry
                return data;
            }
            let quest_drops = get_quest_drops({}, wave_group_data[`${quest.wave_group_id_1}`]);
            quest_drops = get_quest_drops(quest_drops, wave_group_data[`${quest.wave_group_id_2}`]);
            quest_drops = get_quest_drops(quest_drops, wave_group_data[`${quest.wave_group_id_3}`]);

            // INIT QUEST ENTRY
            if (!data[quest.key]) {
                data[quest.key] = {
                    name: {
                        "JP": quest.name,
                    },
                    stamina: {
                        "JP": quest.stamina,
                    },
                    drop_table: {
                        "JP": {
                            memory_piece: quest_drops.memory_piece,
                            drops: quest_drops.drops,
                            subdrops: quest_drops.subdrops,
                            ...(quest_drops.subdrops_2 && { subdrops_2: quest_drops.subdrops_2 }),
                        },
                    },
                };
            }
            else {
                data[quest.key].name[region] = quest.name;
                data[quest.key].stamina[region] = quest.stamina;
                data[quest.key].drop_table[region] = {
                    memory_piece: quest_drops.memory_piece,
                    drops: quest_drops.drops,
                    subdrops: quest_drops.subdrops,
                    ...(quest_drops.subdrops_2 && { subdrops_2: quest_drops.subdrops_2 }),
                };
            }
        }
    });
}

function write_event_quest(quest_data) {
    /**
     * DATABASE NOTES
     *
     * shiori_quest:
     *  COLUMNS: quest_ids, event_id, names, stamina, drop_reward_id, drop_reward_odds
     */
    return new Promise(async function(resolve) {
        let result;
        const drops = [
            {
                "item": "unknown",
                "drop_rate": 0
            },
            {
                "item": "unknown",
                "drop_rate": 0
            },
            {
                "item": "unknown",
                "drop_rate": 0
            },
        ];
        const subdrops = [
            {
                "item": "unknown",
                "drop_rate": 0
            },
            {
                "item": "unknown",
                "drop_rate": 0
            },
            {
                "item": "unknown",
                "drop_rate": 0
            },
            {
                "item": "unknown",
                "drop_rate": 0
            },
            {
                "item": "unknown",
                "drop_rate": 0
            },
        ];

        for (const region of ["JP", ...OTHER_REGIONS]) {
            let db = await open({
                filename: path.join(DIRECTORY.DATABASE, `master_${region.toLowerCase()}.db`),
                driver: sqlite3.Database
            });
            if (["JP"].includes(region)) {
                // whatever latest version JP obfuscation is
                result = await db.all(`SELECT
                    "${database_keys.shiori_quest.event_id}" as event_id,
                    "${database_keys.shiori_quest.quest_name}" as quest_name,
                    "${database_keys.shiori_quest.stamina}" as stamina,
                    "${database_keys.shiori_quest.drop_reward_id}" as drop_reward_id,
                    "${database_keys.shiori_quest.drop_reward_odds}" as drop_reward_odds
                    FROM ${database_keys.shiori_quest._table}`);
            } else if ([].includes(region)) {
                // v4 obfuscation
                result = await db.all(`SELECT
                    "83dc06b28c936d105a6e041bb67ae1845eedb47fac65fdf0d5c4d0e66d765218" as event_id,
                    "486b0088c230bb3f10cc3bddb4ef71ea00151d8a05fdf9786312b1903e8207e7" as quest_name,
                    "7f2fe9a6ff536124a06be7417b01e9a5076dead3515a1809031c3addc0da52c2" as stamina,
                    "11d57be6d0ad57b7d23ce4c1a4b5baddb9a993f3e474581f8d80786a3f48fea3" as drop_reward_id,
                    "33e9ce988a604b47fac48fefec36ad61f97631a42eaec2f2dad5c41362d0d839" as drop_reward_odds
                    FROM v1_17808def077ea1aa94785704801963da4378d0eef5df0d9c0f014a2948caeefb`);
            } else if ([].includes(region)) {
                // v3 obfuscation
                result = await db.all(`SELECT
                    "d5f06ee944365245f66a1d85766aa7c2db9da5754ad752f51ecdff8b8cae6adb" as event_id,
                    "17c6931c298315edb8406602293527f80df22a4cb47aba1043a1d4a2f75369cf" as quest_name,
                    "ff7bcafb0b45d09b2d69fd771098d4b80a6049d844a6a877892a533fe0f07e61" as stamina,
                    "255e8351b04eb438b2c9241be7a4b0877871faf7c7d2e495151faf58fad624e3" as drop_reward_id,
                    "8be797bd625f2c5b7d52fbbb360d883e1f164af6d8d37120cf7ce665b3d6810d" as drop_reward_odds
                    FROM v1_11bdc61c6faee7aa5932b0eed667d882416977287ccc9e4ed169ddff9c2fe28e`);
            } else if ([].includes(region)) {
                // v2 obfuscation
                result = await db.all(`SELECT
                    "b766e8e722c2b4a615d8f8e408b8c29a0145d6acb142f88a4643534c5b51c15f" as event_id,
                    "8b02eaca129b43c2bbc4b1a47102e2c0177bfea177edc8ad24ae44f25935827c" as quest_name,
                    "97ac63701346748bb0c2d698bdefb203353dfd5a5ef630cb6dc5839863850b1e" as stamina,
                    "064564d36904439bc99b21fcb9319370b4a725f7d9bd319783a5eb8062074be0" as drop_reward_id,
                    "c3e2f7e34c181bb2d94fb62b68ac1c1b96855ea39934702fc03718edadaef1fd" as drop_reward_odds
                    FROM v1_291b3010eb85ce3dd58a4dbeec4dca27ac1d4565cd6305a3cbd770fec6553a9c`);
            } else if (["TW", "KR"].includes(region)) {
                // v1 obfuscation
                result = await db.all(`SELECT
                    "bc600eda08f1f351f82d7ec9580973b2588c65482633f340d0affa9de7468f04" as event_id,
                    "d10671945da63fd6a0b85abe83c98ee18cf6169e1e03706ac22775ef1cb82c03" as quest_name,
                    "b9147ea52768734e385badf3b3cc03400664c1b6c06381701404ac08ae5c3a3c" as stamina,
                    "abdd5563be620111de55554a82fdaf92553929b149c1ef835e2de367fc688b41" as drop_reward_id,
                    "cc3d0c485e2b0028d45cbfad0ae53dc54bc8be54e84c30a699d0d9d81ba6720d" as drop_reward_odds
                    FROM v1_742d3ecd7e301cdff955127e3a344b73f24a0290523d0efcea89771a6528ad1d`);
            } else {
                result = await db.all('SELECT * FROM shiori_quest');
            }
            result.forEach((row) => {
                if (row.drop_reward_id === 0) {
                    return;
                }
                const name = row.quest_name,
                    _trimmed_name = name.split(' ').pop().trim(),
                    number = _trimmed_name.substring(_trimmed_name.indexOf('-') + 1),
                    quest_key = `${row.event_id - 20000}-${number}E`;
                if (!quest_data[quest_key]) {
                    quest_data[quest_key] = {
                        name: {
                            "JP": name,
                        },
                        stamina: {
                            "JP": row.stamina,
                        },
                        drop_table: {
                            "JP": {
                                memory_piece: {
                                    item: `${row.drop_reward_id}`,
                                    drop_rate: row.drop_reward_odds,
                                },
                                drops,
                                subdrops,
                            }
                        },
                    };
                }
                else {
                    quest_data[quest_key].name[region] = name;
                    quest_data[quest_key].stamina[region] = row.stamina;
                    quest_data[quest_key].drop_table[region] = {
                        memory_piece: {
                            item: `${row.drop_reward_id}`,
                            drop_rate: row.drop_reward_odds,
                        },
                        drops,
                        subdrops,
                    };
                }
            });
            db.close();
        }
        resolve(quest_data);
    });
}

function get_new_images(data) {
    return new Promise(async (resolve) => {
        let queue = [];

        // CHECK EQUIPMENT
        console.log("SEARCHING FOR MISSING ITEM IMAGES...");
        for (const key in data.equipment) {
            const equipment = data.equipment[key],
                id = equipment.id,
                fragment_id = equipment.fragment.id;
            // CHECK IF IMAGE ALREADY EXISTS
            if (!fs.existsSync(path.join(DIRECTORY.IMAGE_OUTPUT, 'items', `${id}.png`)) && id !== "unknown") {
                if (id.substring(0, 2) === "31" || id.substring(0, 2) === "32") {
                    // EQUIPMENT IS A MEMORY PIECE
                    queue.push(`item_${id}`);
                }
                else {
                    // REGULAR ITEM, BUSINESS AS USUAL
                    queue.push(`equipment_${id}`);
                }
            }
            if (!fs.existsSync(path.join(DIRECTORY.IMAGE_OUTPUT, 'items', `${fragment_id}.png`)) && fragment_id !== "unknown") {
                queue.push(`equipment_${fragment_id}`);
            }
        }

        // CHECK CHARACTERS
        console.log("SEARCHING FOR MISSING CHARACTER IMAGES...");
        for (const key in data.character) {
            // GET THE 3star+ RARITY IMAGE
            const unit_3_id = `${key.substring(0, 4)}3${key.substring(5)}`;

            // CHECK IF IMAGE ALREADY EXISTS (UNIT ICON IMAGES ARE SAVED AS THEIR unit_0_id)
            if (!fs.existsSync(path.join(DIRECTORY.IMAGE_OUTPUT, 'unit_icon', `${key}.png`))) {
                queue.push(`unit_icon_unit_${unit_3_id}`);
            }
            if (!fs.existsSync(path.join(DIRECTORY.IMAGE_OUTPUT, 'unit_still', `${key}.png`))) {
                queue.push(`bg_still_unit_${unit_3_id}`);
            }
        }

        // EXTRACT IF THERE ARE NEW FILES
        if (queue.length <= 0) {
            console.log("NO MISSING IMAGES FOUND.");
            resolve();
            return;
        }

        console.log(`FOUND ${queue.length} MISSING IMAGES. CREATING PIE RECIPE...`);
        console.log(queue);
        const files = await extract_images(queue);
        resolve();

        function extract_images(queue) {
            return new Promise(async (resolve) => {
                const encrypted_dir = path.join(DIRECTORY.SETUP, 'encrypted');
                check_directory(encrypted_dir, true);

                // FIND FILE HASH IN MANIFEST
                const manifest = fs.readFileSync(path.join(DIRECTORY.DATABASE, 'manifest'), 'utf8');
                let files = {};
                let pie = {};

                queue.forEach((file_name) => {
                    const index = manifest.indexOf(file_name),
                        line_end = manifest.indexOf('\n', index),
                        file_data = manifest.substring(index, line_end).split(','),
                        type = file_name.includes('equipment') || file_name.includes('item')
                            ? 'items'
                            : file_name.includes('unit_icon_unit') ? 'unit_icon' : 'unit_still',
                        // file name can be item_###, equipment_###, unit_icon_unit_###, bg_still_unit_###...
                        decrypted_name = file_name.split('_')[(type !== "unit_icon" && type !== "unit_still") ? 1 : 3];
                    files[file_name] = {
                        hash: file_data.length >= 6 ? file_data[2] : file_data[1], // use 2nd hash
                        type,
                        encrypted: path.join(DIRECTORY.SETUP, 'encrypted', `${file_name}.unity3d`),
                        // CONVERT unit_icon IMAGE NAME BACK TO 0star RARITY SO IT CAN BE ACCESSED MORE EASILY
                        // REASON BEING IS THAT unit_id IS SAVED AS 0star RARITY ID
                        decrypted: path.join(DIRECTORY.IMAGE_OUTPUT, type, `${(type !== 'unit_icon' && type !== 'unit_still')
                            ? decrypted_name : `${decrypted_name.substring(0, 4)}0${decrypted_name.substring(5)}`}.png`),
                        webp: path.join(DIRECTORY.IMAGE_OUTPUT, `${type}_webp`, `${(type !== 'unit_icon' && type !== 'unit_still')
                        ? decrypted_name : `${decrypted_name.substring(0, 4)}0${decrypted_name.substring(5)}`}.webp`)
                    };
                    if (new_unity_change) {
                        // we need to use `./static/images` because image extraction will take place while working directory is at root rather than .github/workflows/
                        pie[files[file_name].hash] = {
                            png: path.join(DIRECTORY.IMAGE_OUTPUT, type, `${(type !== 'unit_icon' && type !== 'unit_still')
                                ? decrypted_name : `${decrypted_name.substring(0, 4)}0${decrypted_name.substring(5)}`}.png`),
                            webp: path.join(DIRECTORY.IMAGE_OUTPUT, `${type}_webp`, `${(type !== 'unit_icon' && type !== 'unit_still')
                                ? decrypted_name : `${decrypted_name.substring(0, 4)}0${decrypted_name.substring(5)}`}.webp`)
                        }
                    }
                });

                // DOWNLOAD ENCRYPTED .unity3d FILES FROM CDN
                for (const file_name in files) {
                    if (new_unity_change) {
                        // write pie recipe
                        write_file(DIRECTORY.PIE_RECIPE_OUTPUT, pie);
                    } else {
                        await get_asset(files[file_name].encrypted, files[file_name].hash);
                        console.log(`DOWNLOADED ${file_name}.unity3d [${files[file_name].hash}] ; SAVED AS ${files[file_name].encrypted}`);
                        deserialize(files[file_name].encrypted, files[file_name].decrypted, files[file_name].webp,
                            files[file_name].type === "unit_still");
                    }
                }
                resolve(files);
            });

            function get_asset(output_path, hash) {
                return new Promise(async function(resolve) {
                    const file = fs.createWriteStream(output_path);
                    http.get(`http://prd-priconne-redive.akamaized.net/dl/pool/AssetBundles/${hash.substr(0, 2)}/${hash}`, function(response) {
                        const stream = response.pipe(file);
                        stream.on('finish', () => {
                            resolve();
                        });
                    });
                });
            }

            function deserialize(import_path, export_path, webp_path, still = false, silent = false) {
                console.log("deprecated");
                return;

                function convert_to_webp(input_path, output_path) {
                    webp.cwebp(input_path, output_path, "-q 70");
                }
            }
        }
    });
}

function check_directory(directory, do_clean = false) {
    if (!directory) {
        return;
    }

    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }

    if (do_clean) {
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

function write_file(path, data, readable = false) {
    fs.writeFile(path, JSON.stringify(data, null, readable ? 4 : 0), async function (err) {
        if (err) throw err;
    });
}