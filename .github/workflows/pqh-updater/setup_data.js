const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { PythonShell } = require('python-shell');

// CONSTANTS
const DIRECTORY = Object.freeze({
    // assumed we are in .github/workflows/pqh-updater
    SETUP: `${__dirname}/setup`,
    DATA_OUTPUT: `${__dirname}/../../../public`,
    IMAGE_OUTPUT: `${__dirname}/../../../public/images`,
    DATABASE: `${__dirname}/database`,
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
const LEGACY_DATA = [
    // PUT NEWER LEGACY REVISIONS BEFORE OLDER ONES IN THIS ARRAY
    {
        // HUGE EQUIPMENT COST CHANGE UPDATE
        // 10011550 (last version before update) -> 10011600 (first version after update)
        truth_version: 10011550,
        date: "08.30.2019",
    }
];

setup();
function setup() {
    check_directory(`${DIRECTORY.DATA_OUTPUT}`);
    check_directory(`${DIRECTORY.IMAGE_OUTPUT}`);
    check_directory(`${DIRECTORY.IMAGE_OUTPUT}/items`);
    check_directory(`${DIRECTORY.IMAGE_OUTPUT}/unit_icon`);
    check_directory(DIRECTORY.SETUP, true);

    // CREATE DATA JSON FILE
    let data = {
        character: {},
        equipment: {},
        quest: {},
    }
    write_equipment().then((equipment_data) => {
        data.equipment = equipment_data;
        write_character().then((character_data) => {
            data.character = character_data;
            write_quest().then((quest_data) => {
                data.quest = quest_data;
                get_new_images(data).then(() => {
                    complete();
                });
            });
        });
    });

    function complete() {
        console.log("UPDATE COMPLETE!");
        write_file(path.join(DIRECTORY.DATA_OUTPUT, 'data.json'), data, true);
        write_file(path.join(DIRECTORY.DATA_OUTPUT, 'data.min.json'), data);
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
        console.log("hi from write_equipment", __dirname);
        let db = await open({
            filename: path.join(DIRECTORY.DATABASE, 'master.db'),
            driver: sqlite3.Database
        });
        console.log("did db open?");

        // GET ALL EQUIPMENT DATA
        result = await db.all('SELECT * FROM equipment_data');
        result.forEach((row) => {
            const full_id = (row.equipment_id).toString(),  // 101011
                item_type = get_item_type(full_id),         // 10        (first 2 digits)
                item_id = get_item_id(full_id);             // 1011      (last 4 digits)
            if (item_type === DICTIONARY.EQUIPMENT.FULL) {
                data[full_id] = {
                    id: full_id,
                    name: row.equipment_name,
                    rarity: get_rarity_id(full_id),
                    fragment: {
                        id: "999999",
                        name: "",
                    },
                    recipes: [
                        {
                            required_pieces: 1,
                            required_items: [],
                            recipe_note: "current"
                        }
                    ],
                };
            }
            else {
                const is_fragment = item_type === DICTIONARY.EQUIPMENT.FRAGMENT;
                const is_blueprint = item_type === DICTIONARY.EQUIPMENT.BLUEPRINT;
                if (is_fragment || is_blueprint) {
                    data[`${DICTIONARY.EQUIPMENT.FULL}${item_id}`].fragment.id = full_id;
                    data[`${DICTIONARY.EQUIPMENT.FULL}${item_id}`].fragment.name = row.equipment_name;
                }
            }
        });

        // GET CHARACTER MEMORY PIECES AVAILABLE FROM HARD AND VERY HARD QUESTS
        let memory_pieces = {};
        result = await db.all('SELECT * FROM quest_data');
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

        // ADD MEMORY PIECES TO EQUIPMENT DATA
        result = await db.all('SELECT * FROM item_data');
        result.forEach((row) => {
            if (row.item_type === 11        // MEMORY PIECE
                || row.item_type === 18) {  // PURE MEMORY PIECE

                const item_id = (row.item_id).toString();
                if (memory_pieces[item_id]) {
                    data[`${item_id}`] = {
                        id: item_id,
                        name: row.item_name,
                        rarity: "99",
                        fragment: {
                            id: "999999",
                            name: "",
                        },
                        recipes: [
                            {
                                required_pieces: 1,
                                required_items: [],
                                recipe_note: "current"
                            }
                        ],
                    };
                }
            }
        });

        // ADD CURRENT RECIPE
        result = await db.all('SELECT * FROM equipment_craft');
        result.forEach((row) => {
            const equip_id = row.equipment_id;
            if (get_item_type(equip_id) !== DICTIONARY.EQUIPMENT.FULL) {
                // EQUIPMENT CRAFT DATA IS NOT FOR A FULL ITEM
                return;
            }

            let recipe = data[`${equip_id}`].recipes[0];

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
        // ADD LEGACY RECIPES
        for (const legacy of LEGACY_DATA) {
            db.close();
            db = await open({
                filename: path.join(DIRECTORY.DATABASE, `master_${legacy.truth_version}.db`),
                driver: sqlite3.Database
            });

            result = await db.all('SELECT * FROM equipment_craft');
            result.forEach((row) => {
                const equip_id = row.equipment_id;
                let recipe = {
                    required_pieces: 1,
                    required_items: [],
                    recipe_note: `legacy_${legacy.date}`
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

                // COMPARE RECIPES
                const current_recipe = data[`${equip_id}`].recipes[data[`${equip_id}`].recipes.length - 1];
                if (current_recipe.required_pieces !== recipe.required_pieces) {
                    // DIFFERENCE FOUND, ADD RECIPE TO EQUIPMENT DATA
                    data[`${equip_id}`].recipes.unshift(recipe);
                }
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
            filename: path.join(DIRECTORY.DATABASE, 'master.db'),
            driver: sqlite3.Database
        });

        // GET ALL PLAYABLE CHARACTERS WITH unit_id < 190,000
        result = await db.all('SELECT * FROM unit_data WHERE unit_id < 190000');
        result.forEach((row) => {
            data[`${row.unit_id}`] = {
                id: `${row.unit_id}`,
                name: row.unit_name,
                equipment: {},
            };
        });

        // GET UNIT PROMOTION REQUIREMENTS FOR unit_id < 190,000
        result = await db.all('SELECT * FROM unit_promotion WHERE unit_id < 190000');
        result.forEach((row) => {
            if (!data[`${row.unit_id}`]) {
                return;
            }
            data[`${row.unit_id}`].equipment[`rank_${row.promotion_level}`] = [
                `${row.equip_slot_1}`,
                `${row.equip_slot_2}`,
                `${row.equip_slot_3}`,
                `${row.equip_slot_4}`,
                `${row.equip_slot_5}`,
                `${row.equip_slot_6}`
            ];
        });

        // PURGE UNITS WITH NO EQUIPMENT
        // UNITS LIKE ONES NOT IMPLEMENTED (split units from duo/trio) CAN EXIST
        purge_no_equips();
        db.close();

        // REGION LIMITED CHARACTERS?
        console.log("SEARCHING FOR REGION LIMITED CHARACTERS...");
        db = await open({
            filename: path.join(DIRECTORY.DATABASE, 'redive_cn.db'),
            driver: sqlite3.Database
        });

        result = await db.all('SELECT * FROM unit_data WHERE unit_id < 190000');
        result.forEach((row) => {
            if (data[`${row.unit_id}`]) {
                return;
            }
            console.log(`REGION LIMITED CHARACTER FOUND? ${row.unit_id}`);
            data[`${row.unit_id}`] = {
                id: `${row.unit_id}`,
                name: row.unit_name,
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
            data[`${row.unit_id}`].equipment[`rank_${row.promotion_level}`] = [
                `${row.equip_slot_1}`,
                `${row.equip_slot_2}`,
                `${row.equip_slot_3}`,
                `${row.equip_slot_4}`,
                `${row.equip_slot_5}`,
                `${row.equip_slot_6}`
            ];
        });

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
        let db = await open({
            filename: path.join(DIRECTORY.DATABASE, 'master.db'),
            driver: sqlite3.Database
        });

        // GET ALL QUESTS WITH quest_id < 14,000,000
        result = await db.all('SELECT * FROM quest_data WHERE quest_id < 14000000');
        result.forEach((row) => {
            const name = row.quest_name,
                chapter = name.substring(name.indexOf(' ') + 1, name.indexOf('-')),
                number = name.substring(name.indexOf('-') + 1),
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
        result = await db.all('SELECT * FROM wave_group_data');
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
        result = await db.all('SELECT * FROM enemy_reward_data');
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

            add_quest_entry(quest);

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

                    add_quest_entry(hard_quest);
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

                    add_quest_entry(hard_quest);
                }
                hard_quest_counter++;
                hard_id = `13${chapter}${hard_quest_counter.toString().padStart(3, '0')}`;
            }
        }

        // FINISH
        db.close().finally(() => {
            resolve(data);
        });

        function get_quest_drops(data, wave_group) {
            if (!data.memory_piece) {
                data.memory_piece = {
                    item: "999999",
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

        function add_quest_entry(quest) {
            // GET QUEST DROPS
            let quest_drops = get_quest_drops({}, wave_group_data[`${quest.wave_group_id_1}`]);
            quest_drops = get_quest_drops(quest_drops, wave_group_data[`${quest.wave_group_id_2}`]);
            quest_drops = get_quest_drops(quest_drops, wave_group_data[`${quest.wave_group_id_3}`]);

            // INIT QUEST ENTRY
            data[quest.key] = {
                name: quest.name,
                stamina: quest.stamina,
                memory_piece: quest_drops.memory_piece,
                drops: quest_drops.drops,
                subdrops: quest_drops.subdrops,
            };
        }
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
            if (!fs.existsSync(path.join(DIRECTORY.IMAGE_OUTPUT, 'items', `${id}.png`)) && id !== "999999") {
                if (id.substring(0, 2) === "31" || id.substring(0, 2) === "32") {
                    // EQUIPMENT IS A MEMORY PIECE
                    queue.push(`item_${id}`);
                }
                else {
                    // REGULAR ITEM, BUSINESS AS USUAL
                    queue.push(`equipment_${id}`);
                }
            }
            if (!fs.existsSync(path.join(DIRECTORY.IMAGE_OUTPUT, 'items', `${fragment_id}.png`)) && fragment_id !== "999999") {
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
                queue.push(`unit_${unit_3_id}`);
            }
        }

        // EXTRACT IF THERE ARE NEW FILES
        if (queue.length <= 0) {
            console.log("NO MISSING IMAGES FOUND.");
            resolve();
            return;
        }

        console.log(`FOUND ${queue.length} MISSING IMAGES. DOWNLOADING AND DECRYPTING THEM NOW...`);
        const files = await extract_images(queue);
        resolve();

        function extract_images(queue) {
            return new Promise(async (resolve) => {
                const encrypted_dir = path.join(DIRECTORY.SETUP, 'encrypted');
                check_directory(encrypted_dir, true);

                // FIND FILE HASH IN MANIFEST
                const manifest = fs.readFileSync(path.join(DIRECTORY.DATABASE, 'manifest'), 'utf8');
                let files = {};

                queue.forEach((file_name) => {
                    const index = manifest.indexOf(file_name),
                        line_end = manifest.indexOf('\n', index),
                        file_data = manifest.substring(index, line_end).split(','),
                        type = file_name.includes('equipment') || file_name.includes('item') ? 'items' : 'unit_icon',
                        decrypted_name = file_name.split('_')[1];
                    files[file_name] = {
                        hash: file_data[1],
                        encrypted: path.join(DIRECTORY.SETUP, 'encrypted', `${file_name}.unity3d`),
                        // CONVERT unit_icon IMAGE NAME BACK TO 0star RARITY SO IT CAN BE ACCESSED MORE EASILY
                        // REASON BEING IS THAT unit_id IS SAVED AS 0star RARITY ID
                        decrypted: path.join(DIRECTORY.IMAGE_OUTPUT, type, `${type !== 'unit_icon'
                            ? decrypted_name : `${decrypted_name.substring(0, 4)}0${decrypted_name.substring(5)}`}.png`),
                    };
                });

                // DOWNLOAD ENCRYPTED .unity3d FILES FROM CDN
                for (const file_name in files) {
                    await get_asset(files[file_name].encrypted, files[file_name].hash);
                    console.log(`DOWNLOADED ${file_name}.unity3d [${files[file_name].hash}] ; SAVED AS ${files[file_name].encrypted}`);
                    deserialize(files[file_name].encrypted, files[file_name].decrypted);
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

            function deserialize(import_path, export_path, silent = false) {
                return new Promise(async function(resolve) {
                    PythonShell.run(`${__dirname}/deserialize.py`,
                        { args: [import_path, export_path] },
                        function (err, results) {
                            if (err) throw err;
                            if (!silent) {
                                for (let i of results) {
                                    console.log('[deserialize.py]', i);
                                }
                            }
                            resolve();
                        }
                    );
                });
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