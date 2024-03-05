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
            "117b0f03dced2b67f095ebc64a9e457e748ad48c29d05adf93c9973680910c80" as equipment_id,
            "75c6439b5ed7ca28c9c0fb19fc1e6988f0de438248b1012abf2b250559bcad3e" as equipment_name
            FROM v1_083ad81204aa4a8c48ca5634bc5edb02b89dc9067c8c86549346d01e6d8c52de`);
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
            "1839b5b47535dafc3e83b013174ea6de1b71c20ab270054605b9479ca14892c7" as quest_id,
            "ccf9c5a087abd939497eb2d4067cc9c912aabf3df143ce62cf6adfe56b354db2" as reward_image_1
            FROM v1_44c40227050196c418afee6bb66bfc7a991242f03509a6da081ca925311d6d23`);
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
            "abdd5563be620111de55554a82fdaf92553929b149c1ef835e2de367fc688b41" as drop_reward_id
            FROM v1_742d3ecd7e301cdff955127e3a344b73f24a0290523d0efcea89771a6528ad1d`);
        result.forEach((row) => {
            if (row.drop_reward_id !== 0) {
                memory_pieces[`${row.drop_reward_id}`] = true;
            }
        });

        // ADD MEMORY PIECES TO EQUIPMENT DATA
        // result = await db.all('SELECT * FROM item_data');
        result = await db.all(`SELECT
            "993210ad729a5b7b9fc8824808ca79aba005377696ddd4090beed7a8b33f086a" as item_id,
            "b4cbd9557674c9f93d9971e1b4bacc2d83c0b6c7429046845fd420329d16c04f" as item_name,
            "f0c2615f3f1b52e2e6f9fb4d37a78fa1682e4e458d4ced1b450d3f3c026f1718" as item_type
            FROM v1_0ed9943e72fc03f39c3ef3d8e5c8a62549bbce7de2b1974489742cd9701efe11`);
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
            result = await db.all('SELECT * FROM equipment_data');
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
            result = await db.all('SELECT * FROM item_data');
            result.forEach((row) => {
                const memory_piece = data[`${row.item_id}`];
                if (!memory_piece) {
                    return;
                }
                memory_piece.name[region] = row.item_name;
            });

            // GET REGIONAL RECIPE
            result = await db.all('SELECT * FROM equipment_craft');
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
            "d6b5352a2780d85233a5077f80b0d680d2d2f1a357efe1dc7482fe9783e009a1" as unit_id,
            "e11c46da2b701622247a88c464406d7dea16f7c33f10ed7777453750fcf28d08" as unit_name
            FROM v1_92fec1a41887606642d5ac246c109fc1cc9808b1a637e85ed8bbcd553756b07f
            WHERE "d6b5352a2780d85233a5077f80b0d680d2d2f1a357efe1dc7482fe9783e009a1" < 190000`);
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

            result = await db.all('SELECT * FROM unit_data WHERE unit_id < 190000');
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

            result = await db.all('SELECT * FROM unit_promotion WHERE unit_id < 190000');
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
                        hash: file_data[1],
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