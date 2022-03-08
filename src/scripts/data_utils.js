export default function data_utils(state) {
    const recipe = (function () {
        /**
         * BUILDS AN EQUIPMENT'S RECIPE AND RETURNS IT AS AN {Object}.
         * EXAMPLE RECIPE FOR "105225" (Abyss Moon Staff - Sacrifice || 月淵杖サクリファイス):
         * recipe.get("105225", 3, []) RETURNS...
         * {
         *   "115225": 90,    // Abyss Moon Staff - Sacrifice Fragment
         *   "124224": 45,    // High Devil Wand Fragment
         *   "114221": 30,    // Fury Rod Fragment
         *   "114611": 45,    // Mourning Crescent Moon Fragment
         * }
         *
         * @param {string} item_id               ITEM ID OF THE EQUIPMENT ; i.e. "101011" (FOR "Iron Blade").
         * @param {number} amount                AMOUNT OF AN ITEM TO GET THE RECIPE OF ; i.e. `3` FOR "3 Iron Blades".
         * @param {string[]} rarity_blacklist    ITEM RARITIES THAT SHOULD NOT BE ADDED TO THE RECIPE, IF NOT DEFINED, SETTINGS WILL BE USED.
         * @returns {Object} EQUIPMENT RECIPE ; KEYS ARE THE ITEM FRAGMENT ID ; VALUES ARE AMOUNT NEEDED.
         */
        function build(item_id, amount = 1, rarity_blacklist) {
            if (item_id[1] === "0" && !equipment.exists(item_id)) {
                // ITEM ID DOES NOT EXIST.
                return {};
            }
            if (!rarity_blacklist) {
                // IGNORE NO RARITIES BY DEFAULT
                rarity_blacklist = [];
            }
            if (item_id[1] !== "0") {
                // ITEM ID APPEARS TO BE A FRAGMENT ID. CHECK IF ITEM RARITY IS BLACKLISTED.
                // IF BLACKLISTED, RETURN EMPTY RECIPE. ELSE RETURN RECIPE FOR FRAGMENT.
                return rarity_blacklist.includes(item_id[2]) ? {} : { [item_id]: amount };
            }

            const item_data = equipment.get(item_id);
            const item_recipe = get(item_id);
            let result = {};

            // ADD FRAGMENTS TO RECIPE IF RARITY IS NOT IGNORED AND THERE IS MORE THAN 0 REQUIRED PIECES
            if (!rarity_blacklist.includes(item_data.rarity)
                && item_recipe.required_pieces > 0) {
                result[item_data.fragment.id === "999999" ? item_data.id : item_data.fragment.id] = item_recipe.required_pieces * amount;
            }

            // ADD REQUIRED ITEM RECIPES TO RESULT
            const required_items = item_recipe.required_items;
            for (let i = 0, j = required_items.length; i < j; i++) {
                result = merge(result, build(required_items[i], amount, rarity_blacklist));
            }

            // RECIPE IS COMPLETE
            // debug().log('context/data_utils.recipe.build', `Built recipe for ${item_id} (x${amount})${rarity_blacklist.length > 0 ? ` (ignored rarity ${rarity_blacklist})` : ""}:`);
            // debug().table(result);
            return result;
        }

        /**
         * MERGES TWO OR MORE RECIPE OBJECTS TOGETHER.
         * IF A RECIPE HAS A COMMON ITEM COMPONENT, THE AMOUNTS WILL BE ADDED TOGETHER.
         *
         * EXAMPLE USAGE: recipe.merge(recipe_1, recipe_2, recipe_3, ...);
         *
         * @param  {...Object} recipes    RECIPE OBJECTS TO BE MERGED.
         * @returns {Object} RESULTING RECIPE AFTER MERGE.
         */
        function merge(...recipes) {
            return recipes.reduce((a, b) => {
                for (let f in b) {
                    if (b.hasOwnProperty(f)) {
                        a[f] = (a[f] || 0) + b[f];
                    }
                }
                return a;
            }, {});
        }

        /**
          * GET THE RECIPE TO USE DEPENDING ON `settings.use_legacy`'S VALUE.
          * AT THE TIME OF WRITING, RECIPES ARE FORMATTED LIKE:
          * {
          *   "required_pieces": 1,            // AMOUNT OF FRAGMENTS OF THE ITEM NEEDED.
          *   "required_items": ["101011"],    // ANY ADDITIONAL FULL ITEMS NEEDED.
          *   "recipe_note": "current"         // A COMMENT IF THE RECIPE IS LEGACY OR CURRENT.
          * }
          *
          * @param {String} item_id    ITEM ID OF THE EQUIPMENT ; i.e. "101011" (FOR "Iron Blade").
          * @param {number} version    RECIPE VERSION TO USE, LEAVE THIS UNDEFINED TO USE THE MOST RECENT
          * @returns {Object} RECIPE TO USE.
          */
        function get(item_id, version = undefined) {
            const recipes = state.equipment.data[item_id].recipes;
            if (version !== undefined) {
                // USE THE SPECIFIC RECIPE VERSION IF IT EXISTS, ELSE FALLBACK TO JAPANESE
                return recipes[version] || recipes.JP;
            }
            // USE THE LATEST RECIPE
            return recipes.JP;
        }

        return {
            build,
            merge,
            get,
        };
    })();

    const character = (function () {
        /**
         * CHECK IF A CHARACTER ID EXISTS IN THE LOADED CHARACTER DATA.
         *
         * @param {String} character_id    CHARACTER ID OF THE CHARACTER ; i.e. "100701" (FOR "Miyako").
         * @returns {boolean} TRUE IF CHARACTER EXISTS, FALSE OTHERWISE.
         */
        function exists(character_id) {
            return state.character.data[character_id] !== undefined;
        }

        /**
         * GET THE CHARACTER ID'S CHARACTER DATA ENTRY FROM THE LOADED CHARACTER DATA.
         *
         * @param {String} character_id    CHARACTER ID OF THE CHARACTER ; i.e. "100701" (FOR "Miyako").
         * @returns {Object} CHARACTER ID'S CHARACTER DATA ENTRY, EMPTY OBJECT IF IT DOESN'T EXIST.
         */
        function get(character_id) {
            return state.character.data[character_id] || {};
        }

        return {
            exists,
            get,
        };
    })();

    const equipment = (function () {
        /**
         * CHECK IF AN ITEM ID EXISTS IN THE LOADED EQUIPMENT DATA.
         *
         * @param {String} item_id    ITEM ID OF THE EQUIPMENT ; i.e. "101011" (FOR "Iron Blade").
         * @returns {boolean} TRUE IF ITEM EXISTS, FALSE OTHERWISE.
         */
        function exists(item_id) {
            return state.equipment.data[item_id] !== undefined;
        }

        /**
         * GET THE ITEM ID'S EQUIPMENT DATA ENTRY FROM THE LOADED EQUIPMENT DATA.
         *
         * @param {String} item_id    ITEM ID OF THE EQUIPMENT ; i.e. "101011" (FOR "Iron Blade").
         * @returns {Object} ITEM ID'S EQUIPMENT DATA ENTRY, EMPTY OBJECT IF IT DOESN'T EXIST.
         */
        function get(item_id) {
            return state.equipment.data[item_id] || {};
        }

        const fragment = (function () {
            /**
             * CHECK IF AN ITEM ID EXISTS AND HAS A VALID FRAGMENT ID IN THE LOADED EQUIPMENT DATA.
             *
             * @param {String} item_id    ITEM ID OF THE EQUIPMENT ; i.e. "101011" (FOR "Iron Blade").
             * @returns {boolean} TRUE IF ITEM FRAGMENT EXISTS, FALSE OTHERWISE.
             */
            function fragment_exists(item_id) {
                return exists(item_id) && get(item_id).fragment.id !== "999999";
            }

            /**
             * CONVERT A FRAGMENT ID BACK TO THE FULL ITEM ID.
             *
             * @param {String} fragment_id    ITEM ID OF AN EQUIPMENT FRAGMENT ; i.e. "122282" (FOR "Light Plate Blueprint").
             * @returns ITEM ID OF THE EQUIPMENT FRAGMENT'S PARENT ITEM ; i.e. "102282" (FOR "Light Plate"), "999999" IF PARENT ITEM DOES NOT EXIST.
             */
            function fragment_to_base(fragment_id) {
                // THE PATTERN SEEMS TO BE REPLACING THE 2ND NUMBER WITH A ZERO TO GET THE BASE ITEM ID
                const base_id = `${fragment_id.substring(0, 1)}0${fragment_id.substring(2, fragment_id.length)}`;

                // CHECK IF BASE ITEM EXISTS IN EQUIPMENT DATA, OTHERWISE RETURN "999999" (UNKNOWN ITEM)
                return state.equipment.data[base_id] ? base_id : "999999";
            }

            /**
             * RETRUNS TRUE IF THE GIVEN FRAGMENT ID IS A FRAGMENT OF A BASE ITEM.
             * FRAGMENTS ARE USUALLY INDICATED BY THE SECOND VALUE OF THEIR ID NOT BEING "0".
             *
             * @param {String} fragment_id    ITEM ID OF AN EQUIPMENT FRAGMENT ; i.e. "122282" (FOR "Light Plate Blueprint").
             * @returns TRUE IF THE ID IS A FRAGMENT OF A BASE ITEM, FALSE OTHERWISE.
             */
            function is_fragment(fragment_id) {
                return fragment_id.substring(1, 2) !== "0";
            }

            return {
                exists: fragment_exists,
                to_base: fragment_to_base,
                is_fragment,
            };
        })();

        return {
            exists,
            get,
            fragment,
        };
    })();

    const project = (function () {
        /**
         * CHECKS A USER'S INVENTORY TO SEE IF THEY HAVE ENOUGH ITEMS TO BUILD THE GIVEN PROJECT.
         *
         * @param {Object} project      PROJECT OBJECT, AS STORED IN userState.projects.
         * @param {Object} inventory    INVENTORY OBJECT, AS STORED IN userState.inventory.
         * @param {number} recipe_version    RECIPE VERSION TO USE FOR THE BUILD.
         * @param {Object} ignored_rarity    IGNORED RARITIES TO WATCH OUT FOR ON BUILD.
         * @returns TRUE IF THE USER HAS ENOUGH ITEMS TO BUILD THE PROJECT, FALSE OTHERWISE.
         */
        function check(project, inventory, recipe_version = undefined, ignored_rarity = {}) {
            const timeKey = `data-utils_project.check_${recipe_version}_${project.date}`;
            console.time(timeKey);
            const t_inventory = JSON.parse(JSON.stringify(inventory));
            const result = build(project, inventory, recipe_version, ignored_rarity);
            const resultCopy = JSON.parse(JSON.stringify(result));
            for (const id in result) {
                result[id] -= t_inventory[id] || 0;
                if (result[id] <= 0) {
                    delete result[id];
                }
            }
            console.timeEnd(timeKey);
            return [Object.keys(result).length <= 0, result, resultCopy];
        }

        /**
         * CONSUMES THE REQUIRED ITEMS FROM THE USER'S INVENTORY TO BUILD THE GIVEN PROJECT.
         * THIS WILL NOT MODIFY THE INVENTORY DIRECTLY, IT WILL RETURN A NEW INVENTORY OBJECT.
         * THIS ALSO IGNORES IF THE INVENTORY HAS ENOUGH ITEMS TO BUILD THE PROJECT.
         * IF YOU WANT TO CHECK AND CONSUME THE INVENTORY, USE project.check() BEFORE project.consume().
         *
         * @param {Object} project           PROJECT OBJECT, AS STORED IN userState.projects.
         * @param {Object} inventory         INVENTORY OBJECT, AS STORED IN userState.inventory.
         * @param {number} recipe_version    RECIPE VERSION TO USE FOR THE BUILD.
         * @param {Object} ignored_rarity    IGNORED RARITIES TO WATCH OUT FOR ON BUILD.
         * @returns MODIFIED INVENTORY OBJECT, WITH THE REQUIRED ITEMS CONSUMED.
         */
        function consume(project, inventory, recipe_version = undefined, ignored_rarity = {}) {
            const timeKey = `data-utils_project.consume_${recipe_version}_${project.date}`;
            console.time(timeKey);
            const t_inventory = JSON.parse(JSON.stringify(inventory));
            const result = build(project, inventory, recipe_version, ignored_rarity);
            for (const id in result) {
                t_inventory[id] -= result[id];
                if (t_inventory[id] <= 0 || isNaN(t_inventory[id])) {
                    delete t_inventory[id];
                }
            }
            console.timeEnd(timeKey);
            return t_inventory;
        }

        /**
         * GOES THROUGH ALL REQUIRED (FULL) ITEMS FROM A PROJECT (OR OBJECT MASKING AS A PROJECT) AND THEN FIGURES OUT
         * HOW MANY FRAGMENTS THE PROJECT NEEDS TO BE COMPLETED.
         *
         * @param {Object} project           PROJECT OBJECT, AS STORED IN userState.projects.
         * @param {Object} inventory         INVENTORY OBJECT, AS STORED IN userState.inventory.
         * @param {number} recipe_version    RECIPE VERSION TO USE FOR THE BUILD.
         * @param {Object} ignored_rarity    IGNORED RARITIES TO WATCH OUT FOR ON BUILD.
         * @returns OBJECT CONTAINING REQUIRED FRAGMENT IDS (KEY) AND THEIR AMOUNT (VALUE)
         */
        function build(project, inventory, recipe_version = undefined, ignored_rarity = {}) {
            const t_inventory = JSON.parse(JSON.stringify(inventory));
            // console.log("start build ==============", project, t_inventory);
            // result = items that are consumed from inventory
            const result = {};
            for (const id in project.required) {
                const amt = project.required[id];
                recursive(id, amt);
            }
            function recursive(id, amount) {
                const item_data = equipment.get(id);
                const item_recipe = recipe.get(id, recipe_version);
                const fragment_id = item_data.fragment.id === "999999" ? id : item_data.fragment.id;
                // console.log("start full_item", id, item_data, item_recipe, result);
                // don't do full item calc if item rarity is ignored
                if (t_inventory[id] && !ignored_rarity[item_data.rarity]) {
                    // inventory is currently holding pre-built full versions of this item
                    // console.log("inv has (full item) ", id, amount);
                    result[id] = amount - t_inventory[id];
                    if (result[id] <= 0) {
                        // probably done here, inventory has more than we needed
                        result[id] = amount; // set result to inventory amount consumed
                        t_inventory[id] -= amount; // subtract from inventory
                        return;
                    }
                    // console.log(`we have ${t_inventory[id]} (full item), so we should only care for the remaining ${amount - t_inventory[id]}`);
                    result[id] = t_inventory[id]; // set result to amount of full items we already had
                    amount -= t_inventory[id]; // subtract from full items we already had
                    t_inventory[id] = 0; // set inventory to 0, since we used it up
                }

                // console.log("append required pieces", fragment_id, item_recipe.required_pieces, amount);
                // don't add this item's fragments if its rarity is ignored
                if (!ignored_rarity[item_data.rarity]) {
                    result[fragment_id] = (item_recipe.required_pieces * amount) + (result[fragment_id] || 0);
                }

                // console.log("looping through required items now");
                for (const required_id of item_recipe.required_items) {
                    recursive(required_id, amount);
                }
            }
            // console.log("finished build result", result);
            return result;
        }

        /**
         * GO THROUGH AN ARRAY OF PROJECT OBJECTS TO CREATE A COLLECTION OF REQUIRED OBJECTS.
         * THIS IS ALREADY DONE IN components/QuestDrawer.js BY THE WAY.
         *
         * @param {Array} projects    ARRAY OF ENABLED PROJECT OBJECTS TO COMBINE ALL REQUIRED ITEMS FOR.
         */
        function compile(projects) {
            const result = {};
            for (const project of projects) {
                for (const id in project.required) {
                    result[id] = (result[id] || 0) + project.required[id];
                }
            }
            return result;
        }

        return {
            check,
            consume,
            build,
            compile,
        };
    })();

    const quest = (function () {
        const DIFFICULTY = Object.freeze({
            HARD: "H",
            VERY_HARD: "VH",
            EVENT: "E",
        });
        const _MULTIPLIER = Object.freeze({
            priority: 2.0,
        });
        /**
         * BUILD LIST OF QUESTS FROM THE GIVEN required_items
         * @param {Object} param0                   OBJECT CONTAINING REQUIRED ARGUMENTS
         * @param {Object} param0.projects          ARRAY OF ENABLED PROJECTS
         * @param {Object} param0.all_projects      ALL PROJECTS FROM userState.projects ; USED TO CALC PRIORITY ITEMS
         * @param {Object} param0.compiled          OBJECT OF PRE-COMPILED REQUIRED ITEMS FROM ENABLED PROJECTS
         * @param {Object} param0.inventory         USER INVENTORY OBJECT FROM userState
         * @param {Object} param0.use_inventory     (OPTIONAL) BOOLEAN, IF TRUE, WILL APPLY ITEMS FROM INVENTORY
         * @returns {Array} ARRAY CONTAINING LIST OF QUEST IDS AND THEIR QUEST SCORES
         */
        function build({ all_projects, compiled, inventory, settings = {},
            use_inventory = false, recipe_version = undefined }) {
                console.log("using recipe version", recipe_version);
            const timeKey = `data-utils_quest.build_${Date.now()}`;
            console.time(timeKey);
            // APPLY INVENTORY TO REQUIRED ITEMS
            // turn compiled into a fake project by putting it under a "required" key lol
            let required, required_clean; // required = with inventory, requiredClean = without inventory
            if (use_inventory) {
                const result = project.check({date: "quest-build", required: compiled}, inventory,
                    recipe_version, settings.ignored_rarity || {});
                required = result[1];
                required_clean = result[2];
            }
            else {
                required = required_clean = project.build({required: compiled}, {}, recipe_version,
                    settings.ignored_rarity || {}); // empty inventory
            }

            if (Object.keys(required).length <= 0) {
                // can't make quests with no required items
                console.log("can't make quests with no required items");
                console.timeEnd(timeKey);
                return {
                    data: state,
                    required,
                    required_clean,
                    quest_scores: [],
                    priority_items: [],
                    priority_amount: {},
                    DIFFICULTY,
                };
            }

            // GET PRIORITY ITEMS (used to mark specific items as important, doubt amount needed is useful)
            // priority items include even disabled projects marked as priority
            let priority_set = new Set();
            let priority_amount = {};
            for (const proj of all_projects) {
                if (!proj.priority) {
                    continue;
                }
                for (const id in proj.required) {
                    if (!equipment.exists(id)) {
                        // invalid id
                        continue;
                    }
                    priority_set.add(id);
                    // priority_items.push(id);
                    priority_amount[id] = (priority_amount[id] || 0) + proj.required[id];
                }
            }
            // convert to set to remove dupes, then back to array, then to object with a { item_id: 1 } format
            // priority_items = { id: amt, id2: amt, ... }
            let priority_items = Array.from(priority_set).reduce((a, c) => {a[c] = priority_amount[c]; return a;}, {});
            // console.log(priority_items, "priority items");
            // get all items in their decompiled form
            priority_items = project.build({required: priority_items}, {}, recipe_version);
            // from {item_id: amount} to [item_id, item_id_2, ...]
            priority_amount = priority_items;
            priority_items = Object.keys(priority_items);

            let quest_scores = search({ required, priority_items, settings });

            console.timeEnd(timeKey);
            return {
                data: state,
                required,
                required_clean,
                quest_scores,
                priority_items,
                priority_amount,
                DIFFICULTY,
            };
        }

        /**
         * figure out quest scores
         * @returns
         */
        function search({ required, priority_items, settings = {} }) {
            console.log({ required, priority_items, settings });
            let quest_scores = []; // [[quest_id, quest_score], ...]
            for (const quest_id in state.quest.data) {
                const quest_info = state.quest.data[quest_id];
                const quest_chapter = get_chapter(quest_id);
                const is_normal = !quest_id.includes(DIFFICULTY.HARD) && !quest_id.includes(DIFFICULTY.EVENT);
                const is_hard = quest_id.includes(DIFFICULTY.HARD) && !quest_id.includes(DIFFICULTY.VERY_HARD);
                const is_very_hard = quest_id.includes(DIFFICULTY.VERY_HARD);
                const is_event = quest_id.includes(DIFFICULTY.EVENT);

                // CHECK IF QUEST IS WITHIN RANGE OF MIN/MAX
                if (settings.chapter && (quest_chapter < settings.chapter.min || quest_chapter > settings.chapter.max)) {
                    continue;
                }

                // FILTER OUT QUEST DIFFICULTY HERE
                if (settings.disabled_difficulty) {
                    if ((settings.disabled_difficulty["Normal"] && is_normal)
                        || (settings.disabled_difficulty["Hard"] && is_hard)
                        || (settings.disabled_difficulty["Very Hard"] && is_very_hard)
                        || (settings.disabled_difficulty["Event"] && is_event)) {
                        continue;
                    }
                }

                // FILTER OUT QUESTS THAT DON'T HAVE FOCUSED ITEMS / FILTERED ITEMS
                if (settings.item_filter && settings.item_filter.length > 0) {
                    let pass = false;
                    for (const id of settings.item_filter) {
                        if (!check_item(id, quest_info)) {
                            continue;
                        }
                        pass = true;
                    }
                    if (!pass) {
                        // console.log("filtered", quest_info);
                        continue;
                    }
                }

                function get_quest_score(item_id, drop_percent) {
                    if (!required.hasOwnProperty(item_id)) {
                        // ITEM IS NOT REQUIRED, SO IT CONTRIBUTES 0 TO SCORE
                        return 0;
                    }
                    // ITEM EXISTS IN RECIPE
                    let result = drop_percent;

                    // CHECK IF ITEM IS A PRIORITY ITEM
                    result *= priority_items.includes(item_id) ? _MULTIPLIER.priority : 1;

                    return result;
                }

                // GET QUEST SCORE
                let quest_score = 0;
                // memory piece
                quest_score += get_quest_score(quest_info.memory_piece.item, quest_info.memory_piece.drop_rate);
                // main drops
                for (const item of quest_info.drops) {
                    quest_score += get_quest_score(item.item, item.drop_rate);
                }
                // subdrops
                for (const item of quest_info.subdrops) {
                    quest_score += get_quest_score(item.item, item.drop_rate);
                }

                // HANDLE EVENT MULTIPLIERS
                if (is_normal && settings?.drop_buff?.["Normal"]) {
                    quest_score *= settings.drop_buff["Normal"];
                }
                if (is_hard && settings?.drop_buff?.["Hard"]) {
                    quest_score *= settings.drop_buff["Hard"];
                }
                if (is_very_hard && settings?.drop_buff?.["Very Hard"]) {
                    quest_score *= settings.drop_buff["Very Hard"];
                }

                if (quest_score > 0) {
                    // calculate final quest score
                    quest_score /= quest_info.stamina;
                    quest_scores.push([quest_id, +quest_score.toFixed(2)]);
                }
            }

            // SORT QUEST SCORES
            quest_scores.sort((a, b) => {
                const quest_a = {
                    id: a[0],
                    chapter: get_chapter(a[0]),
                    number: `${get_number(a[0])}`,
                    value: 0,
                };
                const quest_b = {
                    id: b[0],
                    chapter: get_chapter(b[0]),
                    number: `${get_number(b[0])}`,
                    value: 0,
                };
                function get_value(quest) {
                    // VERY HARD QUESTS GET A BASE VALUE OF +2000
                    if (quest.number.includes(DIFFICULTY.VERY_HARD)) {
                        quest.number.replace(DIFFICULTY.VERY_HARD, "");
                        quest.value += 2000;
                    }
                    // HARD QUESTS GET A BASE VALUE OF +1000
                    if (quest.number.includes(DIFFICULTY.HARD)) {
                        quest.number.replace(DIFFICULTY.HARD, "");
                        quest.value += 1000;
                    }
                    // EVENT QUESTS GET A BASE VALUE OF +1000
                    if (quest.number.includes(DIFFICULTY.EVENT)) {
                        quest.number.replace(DIFFICULTY.EVENT, "");
                        quest.value += 1000;
                    }
                    quest.value += (quest.chapter * 10000) + (parseInt(quest.number) * 10);
                }
                function sort_ascending(x, y) {
                    return x - y;
                }
                function sort_descending(x, y) {
                    return y - x;
                }

                get_value(quest_a);
                get_value(quest_b);

                let n = (settings.sort && settings.sort.score) ? sort_ascending(a[1], b[1]) : sort_descending(a[1], b[1]);
                if (n !== 0) {
                    // end sort now if not equal
                    return n;
                }
                return (settings.sort && settings.sort.list) ? sort_descending(quest_a.value, quest_b.value)
                    : sort_ascending(quest_a.value, quest_b.value);
            });

            return quest_scores;
        }

        /**
         * QUICKLY COMPILE A LIST OF QUESTS AND RETURN THE AMOUNT
         *
         * @param {Object} compiled    OBJECT OF PRE-COMPILED REQUIRED ITEMS FROM ENABLED PROJECTS
         * @returns {number} AMOUNT OF QUESTS WITH NO SETTINGS APPLIED
         */
        function estimate(compiled) {
            console.time("quest.estimate");
            const MAX = 100;
            const compiled_fragments = project.build({required: compiled}, {}); // need to project.build() because compiled is full items
            let counter = 0;
            for (const key in state.quest.data) {
                if (counter >= MAX) {
                    break;
                }
                const quest_info = state.quest.data[key];

                counter = search_through(counter);
                function search_through(count) {
                    // check memory piece (memory piece can't exist as a fragment)
                    if (compiled_fragments.hasOwnProperty(quest_info.memory_piece.item)) {
                        return ++count;
                    }

                    // check main drops
                    for (const item of quest_info.drops) {
                        if (compiled_fragments.hasOwnProperty(item.item)) {
                            return ++count;
                        }
                    }

                    // check subdrops
                    for (const subdrop of quest_info.subdrops) {
                        if (compiled_fragments.hasOwnProperty(subdrop.item)) {
                            return ++count;
                        }
                    }
                    return count;
                }
            }
            console.timeEnd("quest.estimate");
            return counter;
        }

        /**
         * CHECK IF AN ITEM OR ITS FRAGMENT EXISTS AS A REQUIRED COMPONENT IN A QUEST.
         * A REQUIRED COMPONENT IS IF IT EXISTS AS A MAIN ITEM, MEMORY PIECE, OR SUBDROP.
         *
         * @param {String} item_id       FULL OR FRAGMENT ID TO SEARCH FOR, CAN NOT BE "999999" ; i.e. "101011"
         * @param {Object} quest_info    DATA OBJECT ABOUT A QUEST ; state.quest.data[quest_id]
         * @returns TRUE IF ITEM OR ITS FRAGMENT EXISTS IN THIS QUEST, FALSE OTHERWISE
         */
        function check_item(item_id, quest_info) {
            let full, fragment;
            if (equipment.exists(item_id)) {
                // this is a memory piece or full item
                full = item_id;
                fragment = equipment.get(item_id).fragment.id;
            }
            else {
                // either a fragment or faulty item_id
                full = equipment.fragment.to_base(item_id);
                fragment = item_id;
            }
            if (full === "999999") {
                // full item not found, so this is a faulty item_id
                return false;
            }

            // check memory piece (memory piece can't exist as a fragment)
            if (quest_info.memory_piece.item === full) {
                return true;
            }

            // check main drops
            for (const item of quest_info.drops) {
                if (item.item === full || item.item === fragment) {
                    return true;
                }
            }

            // check subdrops
            for (const subdrop of quest_info.subdrops) {
                if (subdrop.item === full || subdrop.item === fragment) {
                    return true;
                }
            }

            return false;
        }

        function get_chapter(quest_id) {
            return parseInt(quest_id.split("-")[0]);
        }

        function get_number(quest_id) {
            return parseInt(quest_id.split("-")[1]);
        }

        return {
            build,
            check: check_item,
            estimate,
            search,
            DIFFICULTY,
        };
    })();

    const test = (function () {
        // generate random list of full items
        function list(amount = 0) {
            let result = {};
            const keys = Object.keys(state.equipment.data);
            while (Object.keys(result).length < amount) {
                const rand = keys[Math.floor(Math.random() * keys.length)];
                result[rand] = Math.floor(Math.random() * 100);
            }
            return result;
        }
        return {
            list,
        };
    })();

    return {
        recipe,
        character,
        equipment,
        project,
        quest,
        test,
    };
}