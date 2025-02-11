import _data from './data.min.json';
import constants from './constants.api';
import type {
    QuestData, Quest, QuestItem, Language, Project, Recipe, Inventory, QuestScore, QuestSettings, SessionProjects,
    EquipmentRecipeData, QuestBuild2Results
} from './api.d';
import { equipment, project, user } from './api';

class StaticVariables {
    static max_chapter : number = -1;
}

/**
 * manages quest data from data.json
 */
export default (() => {
    const data : QuestData = _data.quest;

    /**
     * get quest object from quest data
     *
     * @param {string} id - quest id
     * @returns {Quest} - quest data
     */
    function get(id : string) : Quest {
        return data[id];
    }

    /**
     * get the quest name.
     *
     * @param {string} id - quest id
     * @returns {string | object | undefined} name of quest, quest name object, or undefined
     */
    function getName(id : string, language? : Language) : string | object | undefined {
        if (!data[id]) {
            // quest ID not found
            return undefined;
        }
        if (!language) {
            return data[id]?.name;
        }
        return data[id]?.name?.[language] || data[id]?.name?.JP;
    }

    /**
     * get the quest's stamina cost. this is what a player needs to have in order to run the quest.
     *
     * @param {string} id - quest id
     * @returns {number | object | undefined} stamina cost of quest, quest stamina object, or undefined
     */
    function getStamina(id : string, language? : Language) : number | object | undefined {
        if (!data[id]) {
            // quest ID not found
            return undefined;
        }
        if (!language) {
            return data[id]?.stamina;
        }
        return data[id]?.stamina?.[language] || data[id]?.stamina?.JP;
    }

    /**
     * get the quest's memory piece. a quest may or may not have a memory piece, if this is the case the memory piece
     * id will be assigned "unknown" in data.json, but this function will return undefined.
     *
     * @param {string} id - quest id
     * @returns {QuestItem | undefined} QuestItem, or undefined if memory piece id equals "unknown" or is not found
     */
    function getMemoryPiece(id : string, language : Language) : QuestItem | undefined {
        const drop_table = data[id]?.drop_table[language];
        const memory_piece = (drop_table) ? drop_table.memory_piece : data[id]?.drop_table.JP.memory_piece;

        // return undefined if memory piece is undefined or is "unknown" (doesn't exist)
        return (memory_piece && memory_piece.item !== constants.placeholder_id) ? memory_piece : undefined;
    }

    /**
     * get the main quest drops (the main 3-4 with higher drop rates)
     *
     * @param {string} id - quest id
     * @returns {QuestItem[]} array of quest item drops
     */
    function getDrops(id : string, language : Language) : QuestItem[] {
        const drop_table = data[id]?.drop_table[language];
        const drops = (drop_table) ? drop_table.drops : data[id]?.drop_table.JP.drops;
        return drops || [];
    }

    /**
     * get the subdrop quest drops (the 5 with lower, but respectable, drop rates).
     * subdrops are usually hidden from the player.
     *
     * @param {string} id - quest id
     * @returns {QuestItem[]} array of quest item drops
     */
    function getSubdrops(id : string, language : Language) : QuestItem[] {
        const drop_table = data[id]?.drop_table[language];
        const subdrops = (drop_table) ? drop_table.subdrops : data[id]?.drop_table.JP.subdrops;
        return subdrops || [];
    }

    /**
     * get the second group of subdrop quest drops (the 3 accessories, introduced chapter 64+).
     * subdrops are usually hidden from the player.
     *
     * @param {string} id - quest id
     * @returns {QuestItem[]} array of quest item drops
     */
    function getSubdrops2(id : string, language : Language) : QuestItem[] {
        const drop_table = data[id]?.drop_table[language];
        const subdrops = (drop_table) ? drop_table.subdrops_2 : data[id]?.drop_table.JP.subdrops_2;
        return subdrops || [];
    }

    /**
     * check if a quest is normal difficulty based on its quest id.
     *
     * @param {string} id - quest id
     * @returns {boolean} true if the quest is normal difficulty, false if not
     */
    function isNormal(id : string) : boolean {
        // normal quests do not have "H" or "E" but must also not be blank in their ids
        return id !== "" && !id.includes(constants.difficulty.hard) && !id.includes(constants.difficulty.event);
    }

    /**
     * check if a quest is hard difficulty based on its quest id.
     *
     * @param {string} id - quest id
     * @returns {boolean} true if the quest is hard difficulty, false if not
     */
    function isHard(id : string) : boolean {
        // hard quests have "H" but not "VH" in their ids
        return id.includes(constants.difficulty.hard) && !id.includes(constants.difficulty.very_hard);
    }

    /**
     * check if a quest is very hard difficulty based on its quest id.
     *
     * @param {string} id - quest id
     * @returns {boolean} true if the quest is very hard difficulty, false if not
     */
    function isVeryHard(id : string) : boolean {
        // very hard quests have "VH" in their ids
        return id.includes(constants.difficulty.very_hard);
    }

    /**
     * check if a quest is event difficulty based on its quest id.
     * event quests are hidden behind limited or permanent story events.
     *
     * @param {string} id - quest id
     * @returns {boolean} true if the quest is event difficulty, false if not
     */
    function isEvent(id : string) : boolean {
        // event quests have "E" in their ids
        return id.includes(constants.difficulty.event);
    }

    /**
     * get the quest's chapter number from its quest id.
     *
     * @param {string} id - quest id
     * @returns {number} chapter number
     */
    function getChapter(id : string) : number {
        return parseInt(id.split("-")[0]);
    }

    /**
     * get the quest's number from its quest id.
     *
     * @param {string} id - quest id
     * @returns {number} quest number
     */
    function getNumber(id : string) : number {
        return parseInt(id.split("-")[1]);
    }

    /**
     * get the highest quest chapter currently available.
     *
     * @returns {number} max chapter number
     */
    function getMaxChapter() : number {
        if (StaticVariables.max_chapter === -1) {
            // init max chapter
            let max = -1;
            for (const key in data) {
                const chapter = getChapter(key);
                max = Math.max(max, chapter);
            }
            StaticVariables.max_chapter = max;
        }
        return StaticVariables.max_chapter;
    }

    /**
     * check if a quest id exists in the data.json file
     *
     * @param {string} id - quest id
     * @returns {boolean} true if quest exists, false otherwise
     */
    function exists(id : string) : boolean {
        return data[id] !== undefined;
    }

    interface QuestBuildArguments {
        all_projects : Project[];
        compiled_items : Recipe;
        inventory : Inventory;
        settings : QuestSettings;
        use_inventory : boolean;
        language : Language;
    }

    function build({
        all_projects,
        compiled_items,
        inventory,
        settings = {},
        use_inventory = false,
        language = "UNKNOWN",
    } : QuestBuildArguments) {
        const time_key = `api.quest#build: (${language} | ${Date.now().toLocaleString()})`;
        console.time(time_key);

        // apply inventory to required items
        // turn compiled into a fake project by putting it under a "required" key lol
        let required; // with inventory applied
        let required_clean; // no inventory applied

        if (use_inventory) {
            const result = project.check(
                {date: "quest-build", required: compiled_items},
                inventory, language, settings.ignored_rarities
            );
            required = result.remaining;
            required_clean = result.recipe;
        }
        else {
            // required and required_clean results will be the same without inventory
            required = required_clean = project.build(
                {date: "quest-build", required: compiled_items},
                {}, language, settings.ignored_rarities
            );
        }

        if (Object.keys(required).length <= 0) {
            // can't make quest list with no required items
            console.log("can't make quest list with no required items");
            console.timeEnd(time_key);
            return {
                required,
                required_clean,
                quest_scores: [],
                priority_items: [],
                priority_amount: {},
            }
        }

        // get priority items (used to mark specific items as important, amount needed is not useful)
        // priority items include even disabled projects marked as priority
        let priority_set = new Set();
        let priority_amount : Recipe = {};
        for (const proj of all_projects) {
            if (!proj.priority) {
                // ignoring non-priority projects
                continue;
            }
            for (const id in proj.required) {
                if (!equipment.exists(id)) {
                    // invalid equipment id in project required
                    continue;
                }
                priority_set.add(id);
                priority_amount[id] = (priority_amount[id] || 0) + proj.required[id];
            }
        }
        // convert to set to remove duplicates keys, then back to array, then to object with a { item_id : 1 } format
        // priority_items = { id: amt, id2: amt, ... }
        const reduced = Array.from(priority_set).reduce<Recipe>((a : any, c : any) => {
            a[c] = priority_amount[c];
            return a;
        }, {});
        // get all items in their decompiled form
        priority_amount = project.build(
            {date: "quest-build", required: reduced},
            {}, language, {}
        );
        const priority_items = Object.keys(priority_amount);
        const quest_scores : QuestScore[] = search({ required, priority_items, priority_levels: {}, settings, language });
        console.timeEnd(time_key);

        return {
            required,
            required_clean,
            quest_scores,
            priority_items,
            priority_amount,
        };
    }

    interface QuestBuild2Arguments {
        session_projects : SessionProjects;
        inventory? : Inventory;
        settings? : QuestSettings;
        use_inventory : boolean;
        language? : Language;
        silent? : boolean;
    };

    function build2({
        session_projects,
        inventory,
        settings,
        use_inventory = false,
        language,
        silent = false,
    } : QuestBuild2Arguments) : QuestBuild2Results {
        if (!inventory) {
            inventory = user.inventory.get();
        }
        if (!settings) {
            settings = user.settings.quest.get();
        }
        if (!language) {
            language = user.region.get();
        }
        const time_key = `api.quest#build2: (${language} | ${Date.now().toLocaleString()})`;
        if (!silent) {
            console.time(time_key);
        }

        const enabled_projects = Object.keys(session_projects)
            .filter((k) => session_projects[k].enabled)
            .map((k) => session_projects[k].project);
        const compiled_items = project.compile(enabled_projects);

        // apply inventory to required items
        // turn compiled into a fake project by putting it under a "required" key lol
        let required; // with inventory applied
        let required_clean; // no inventory applied

        if (use_inventory) {
            const result = project.check(
                {date: "quest-build-with-inventory", required: compiled_items},
                inventory, language, settings.ignored_rarities, silent
            );
            required = result.remaining;
            required_clean = result.recipe;
        }
        else {
            // required and required_clean results will be the same without inventory
            required = required_clean = project.build(
                {date: "quest-build-no-inventory", required: compiled_items},
                {}, language, settings.ignored_rarities
            );
        }

        if (Object.keys(required).length <= 0) {
            // can't make quest list with no required items
            if (!silent) {
                console.log("can't make quest list with no required items");
                console.timeEnd(time_key);
            }
            return {
                required,
                required_clean,
                quest_scores: [],
                priority_items: [],
                priority_amount: {},
                projects: enabled_projects,
            };
        }

        // get priority items (used to mark specific items as important, amount needed is not useful)
        // priority items include even disabled projects marked as priority
        let priority_levels : { [id : string] : number } = {};
        let priority_set = new Set();
        let priority_amount : Recipe = {};
        for (const proj_key in session_projects) {
            const proj = session_projects[proj_key].project;
            if (!proj.priority) {
                // ignoring non-priority projects
                continue;
            }
            for (const id in proj.required) {
                if (!equipment.exists(id)) {
                    // invalid equipment id in project required
                    continue;
                }
                const priority_level : number = proj.details?.priority_level || 2;
                priority_levels[id] = (priority_levels[id]) // if id exists...
                    ? (
                        (priority_levels[id] > priority_level) // if existing level greater than this
                            ? priority_levels[id] // use existing
                            : priority_level // this is greater, replace existing
                    )
                    : priority_level; // else use this priority_level as default
                priority_set.add(id);
                priority_amount[id] = (priority_amount[id] || 0) + proj.required[id];
            }
        }

        // convert to set to remove duplicate keys, then back to array, then to object with a { item_id : 1 } format
        // priority_items = { id: amt, id2: amt, ... }
        const reduced = Array.from(priority_set).reduce<Recipe>((a : any, c : any) => {
            a[c] = priority_amount[c];
            return a;
        }, {});

        // get all items in their decompiled form
        const results = buildPriorityItems(reduced, priority_levels, language);
        const priority_items = Object.keys(results.priority_amount);
        const quest_scores : QuestScore[] = search({
            required, priority_items, priority_levels: results.priority_levels, settings, language
        });
        if (!silent) {
            console.timeEnd(time_key);
        }

        return {
            required,
            required_clean,
            quest_scores,
            priority_items,
            priority_amount: results.priority_amount,
            projects: enabled_projects,
        };
    }
    function buildPriorityItems(
        priority_recipe : Recipe,
        priority_levels : Recipe, // not exactly a recipe, but same format. { [id]: <priority_level> }
        language : Language = "UNKNOWN"
    ) {
        const result : Recipe = {}; // recipe result
        const level_result : Recipe = {};
        for (const id in priority_recipe) {
            recursive(id, priority_recipe[id], priority_levels[id]);
        }
        return {
            priority_amount: result,
            priority_levels: level_result
        };

        function recursive(id : string, amount : number, priority_level : number) {
            const item_recipe : EquipmentRecipeData = equipment.recipe(id, language);
            const fragment_id : string = equipment.fragmentID(id);

            // don't add this item's fragments if its rarity is ignored or if it doesn't need fragments
            // (items like Sorcerer Glasses (103613) has no fragments)
            if (item_recipe.required_pieces > 0) {
                result[fragment_id] = (item_recipe.required_pieces * amount) + (result[fragment_id] || 0);
                level_result[fragment_id] = (level_result[fragment_id]) // if id exists...
                    ? (
                        (level_result[fragment_id] > priority_level) // if existing level greater than this
                            ? level_result[fragment_id] // use existing
                            : priority_level // this is greater, replace existing
                    )
                    : priority_level; // else use this priority_level as default
            }

            // go through required items
            for (const required_id of item_recipe.required_items) {
                recursive(required_id, amount, priority_level);
            }
        }
    }

    interface QuestSearchArguments {
        required : Recipe;
        priority_items : string[];
        priority_levels : { [id: string]: number },
        settings : QuestSettings;
        language : Language;
    };

    /**
     * figure out quest scores by taking a collection of required and priority items and going through the available
     * quests to see if the items needed exists.
     *
     * @param {QuestSearchArguments} search_args - search arguments
     * @param {Recipe} search_args.required - required items (fragments)
     * @param {string[]} search_args.priority_items - array of item ids that are considered "priority"
     * @param {QuestSettings} search_args.settings - quest settings, e.g. max chapter, min chapter, etc
     * @param {Language} search_args.language - language/server of quest to use
     * @returns {QuestScore[]} - array of sorted quest score objects. sort order depends on settings given
     */
    function search({
        required, priority_items, priority_levels,
        settings = {},
        language = "UNKNOWN"
    } : QuestSearchArguments) : QuestScore[] {
        let quest_scores : QuestScore[] = []; // [{id: "", score: 0}, ...]
        for (const quest_id in data) {
            const quest_chapter = getChapter(quest_id);

            // check if quest is within range of min and max
            if (settings.chapter
                && (quest_chapter < settings.chapter.min || quest_chapter > settings.chapter.max)) {
                // quest out of bounds, ignore
                continue;
            }

            // filter out quest difficulty here
            if (settings.disabled_difficulty
                && ((settings.disabled_difficulty["Normal"] && isNormal(quest_id))
                || (settings.disabled_difficulty["Hard"] && isHard(quest_id))
                || (settings.disabled_difficulty["Very Hard"] && isVeryHard(quest_id))
                || (settings.disabled_difficulty["Event"] && isEvent(quest_id)))
            ) {
                // quest is a difficulty that is disabled, ignore
                continue;
            }

            // filter out quests that don't have focused items / filtered items
            if (settings.item_filter && settings.item_filter.length > 0) {
                // settings has item filter active
                let pass = false;
                for (const id of settings.item_filter) {
                    if (!checkForItem(id, quest_id, language)) {
                        continue;
                    }
                    pass = true;
                    break;
                }
                if (!pass) {
                    // item in item filter does not exist, so ignore
                    continue;
                }
            }

            function getQuestScore(quest_item : QuestItem | undefined) {
                if (!quest_item // quest item does not exist
                    || !required.hasOwnProperty(quest_item.item) // item is not required
                ) {
                    // quest item does not exist or is not required, so it contributes 0 to score
                    return 0;
                }
                // item exists in recipe
                let result = quest_item.drop_rate; // base drop rate
                result *= priority_items.includes(quest_item.item) ? priority_levels[quest_item.item] : 1; // priority item
                // add a bit more score depending on amount needed
                result += (required[quest_item.item] / constants.inventory.max.fragment) * 1000;
                return result;
            }

            // get quest score
            let quest_score = 0;

            // memory piece
            quest_score += getQuestScore(getMemoryPiece(quest_id, language));

            // main drops
            for (const drop of getDrops(quest_id, language)) {
                quest_score += getQuestScore(drop);
            }

            // subdrops
            for (const subdrop of getSubdrops(quest_id, language)) {
                quest_score += getQuestScore(subdrop);
            }

            // subdrops 2
            for (const subdrop2 of getSubdrops2(quest_id, language)) {
                quest_score += getQuestScore(subdrop2);
            }

            // handle event multipliers
            if (isNormal(quest_id) && settings?.drop_buff?.["Normal"]) {
                quest_score *= settings.drop_buff["Normal"];
            }
            if (isHard(quest_id) && settings?.drop_buff?.["Hard"]) {
                quest_score *= settings.drop_buff["Hard"];
            }
            if (isVeryHard(quest_id) && settings?.drop_buff?.["Very Hard"]) {
                quest_score *= settings.drop_buff["Very Hard"];
            }

            // calculate final quest score
            if (quest_score > 0) {
                const stamina = getStamina(quest_id, language);
                if (typeof stamina === "number") { // just making sure stamina is not object/undefined
                    quest_score /= stamina;
                }
                quest_scores.push({
                    id: quest_id,
                    score: +quest_score.toFixed(2),
                });
            }
        }

        // sort quest scores
        quest_scores.sort((a : QuestScore, b : QuestScore) => {
            interface QuestSortObject {
                id : string;
                chapter : number;
                number : number;
                value : number
            };
            const quest_a : QuestSortObject = {
                id: a.id,
                chapter: getChapter(a.id),
                number: getNumber(a.id),
                value: 0,
            };
            const quest_b : QuestSortObject = {
                id: b.id,
                chapter: getChapter(b.id),
                number: getNumber(b.id),
                value: 0,
            };

            function getValue(quest : QuestSortObject) {
                // very hard quests get a base value of +2000
                if (isVeryHard(quest.id)) {
                    quest.value += 2000;
                }
                // hard quests get a base value of +1000
                // event quests get a base value of +1000
                if (isHard(quest.id) || isEvent(quest.id)) {
                    quest.value += 1000;
                }
                quest.value += (quest.chapter * 10000) + (quest.number * 10);
            }
            function sortAscending(x : number, y : number) { return x - y; }
            function sortDescending(x : number, y : number) { return y - x; }

            getValue(quest_a);
            getValue(quest_b);

            let n = (settings.sort && settings.sort.score)
                ? sortAscending(a.score, b.score)
                : sortDescending(a.score, b.score);
            if (n !== 0) {
                // end sort now if not equal
                return n;
            }
            return (settings.sort && settings.sort.list)
                ? sortDescending(quest_a.value, quest_b.value)
                : sortAscending(quest_a.value, quest_b.value);
        });

        return quest_scores;
    }

    /**
     * check if an item or its fragment counterpart exists as a required component in a quest.
     * a requried component is if it exist as a main item, memory piece, or subdrop.
     *
     * @param {string} item_id - full or fragment id to search for, can not be "unknown" ; e.g. "101011"
     * @param {string} quest_id - id of quest to search through ; e.g. "1-1", "1-2H", "3-1VH", "5-1E"
     * @param {Language} language - language/server of quest to search through
     * @returns {boolean} true if the item or its fragment exists in this quest, false otherwise
     */
    function checkForItem(item_id : string, quest_id : string, language : Language) : boolean {
        let full, fragment;
        if (equipment.exists(item_id)) {
            // this is a memory piece or full item
            full = item_id;
            fragment = equipment.fragment(item_id);
        }
        else {
            // either a fragment or faulty item_id
            full = equipment.convertFragmentID(item_id);
            fragment = item_id;
        }
        if (full === constants.placeholder_id) {
            // full item not found, so this is a faulty item_id
            return false;
        }

        // check memory piece (memory piece can't exist as a fragment)
        const memory_piece = getMemoryPiece(quest_id, language);
        if (memory_piece?.item === full) {
            return true;
        }

        // check main drops
        for (const drop of getDrops(quest_id, language)) {
            if (drop.item === full || drop.item === fragment) {
                return true;
            }
        }

        // check subdrops
        for (const subdrop of getSubdrops(quest_id, language)) {
            if (subdrop.item === full || subdrop.item === fragment) {
                return true;
            }
        }

        // check subdrops2
        for (const subdrop2 of getSubdrops2(quest_id, language)) {
            if (subdrop2.item === full || subdrop2.item === fragment) {
                return true;
            }
        }

        // item not found in quest
        return false;
    }

    /**
     * quickly compile a list of quests and return the amount. this is primarily used for the quest count alert icon.
     * this is intended to be a rough estimate of the count and not the actual amount of quests (unless below 100)
     * by default up to 100 quests are counted before it stops.
     *
     * @param {Recipe} compiled - object of pre-compiled required items from enabled projects
     * @returns {number} amount of quests (assuming no settings applied)
     */
    function estimate(compiled : Recipe) : number {
        const MAX = 100;
        console.time("quest.estimate");
        // need to project.build() because compiled has full items only
        const compiled_fragments = project.build({required: compiled}, {});
        let counter : number = 0;
        for (const key in data) {
            if (counter >= MAX) {
                break;
            }
            counter = searchThrough(counter);

            function searchThrough(count : number) : number {
                // check memory piece (memory piece can't exist as fragment)
                const memory_piece = getMemoryPiece(key, "JP");
                if (memory_piece && compiled_fragments.hasOwnProperty(memory_piece.item)) {
                    return ++count;
                }

                // check main drops
                for (const drop of getDrops(key, "JP")) {
                    if (compiled_fragments.hasOwnProperty(drop.item)) {
                        return ++count;
                    }
                }

                // check subdrops
                for (const subdrop of getSubdrops(key, "JP")) {
                    if (compiled_fragments.hasOwnProperty(subdrop.item)) {
                        return ++count;
                    }
                }

                // check subdrops2
                for (const subdrop2 of getSubdrops2(key, "JP")) {
                    if (compiled_fragments.hasOwnProperty(subdrop2.item)) {
                        return ++count;
                    }
                }

                // return no changes
                return count;
            }
        }
        console.timeEnd("quest.estimate");
        return counter;
    }

    interface QuestSimulatorSettings {
        normal_drop : number; // normal quest drop multiplier
        hard_drop : number; // H drop multiplier
        very_hard_drop : number; // VH drop multiplier
        use_inventory : boolean; // copy user's initial inventory or not
        precise? : boolean; // use precise mode or not
    };
    function questSimulator(session_projects : SessionProjects,
        settings : QuestSimulatorSettings = {
            normal_drop: 1,
            hard_drop: 1,
            very_hard_drop: 1,
            use_inventory: true,
            precise: false,
        },
        init_build_results : QuestBuild2Results | undefined = undefined
    ) {
        const time_key = `api.quest#questSimulator: (${Date.now().toLocaleString()};precise:${settings.precise || false})`;
        console.time(time_key);

        interface QuestResult {
            id: string;
            stamina: number; // quest's stamina cost
            total_stamina: number; // current total stamina consumed at this point
            drops: Recipe; // drop results from this quest
        };
        let inventory : Recipe;
        if (settings.use_inventory) {
            // load user
            inventory = JSON.parse(JSON.stringify(user.inventory.get()));
        }
        else {
            inventory = {};
        }
        let build_results : QuestBuild2Results;
        if (init_build_results) {
            build_results = JSON.parse(JSON.stringify(init_build_results));
        }
        else {
            build_results = rebuild();
        }
        let quests : QuestResult[] = []; // quests performed + what dropped
        let stamina = 0; // total stamina used
        let total_drops : Recipe = {};
        const original_required = JSON.parse(JSON.stringify(build_results.required));

        while (build_results.quest_scores.length > 0) {
            const should_rebuild = simulateQuestDrops(build_results.quest_scores[0].id, user.region.get());
            if (settings.precise || should_rebuild) {
                // rebuild quests regardless of item completion if settings.precise
                // keep repeating quest sim until 1 item is consumed totally if not settings.precise
                build_results = rebuild();
            }
        }
        console.timeEnd(time_key);
        return {
            stamina,
            quests,
            total_drops,
            required: original_required
        };

        function rebuild() {
            // need to use inventory to keep track of progress, the setting is ONLY for if saved inventory should be used
            return build2({ session_projects, inventory, use_inventory: true, silent: true,
                settings: user.settings.quest.get()
            });
        }

        function simulateQuestDrops(quest_id : string, language : Language) {
            let completed_item = false; // if true, at least 1 item has been completed
            const drop_amount = isEvent(quest_id) ? 1
                : isVeryHard(quest_id) ? settings.very_hard_drop || 1
                : isHard(quest_id) ? settings.hard_drop || 1
                : isNormal(quest_id) ? settings.normal_drop || 1
                : 1;
            const stamina_cost : number = getStamina(quest_id, language) as number;
            const drops : Recipe = {};
            stamina += stamina_cost;
            const memory_piece = getMemoryPiece(quest_id, language);
            if (memory_piece) {
                const rng = Math.random() * 100;
                if (rng <= memory_piece.drop_rate) {
                    // item get
                    inventory[memory_piece.item] = (inventory[memory_piece.item])
                        ? inventory[memory_piece.item] + drop_amount
                        : drop_amount;
                    total_drops[memory_piece.item] = (total_drops[memory_piece.item])
                        ? total_drops[memory_piece.item] + drop_amount : drop_amount;
                    drops[memory_piece.item] = (drops[memory_piece.item])
                        ? drops[memory_piece.item] + drop_amount : drop_amount;
                    if (build_results.required_clean[memory_piece.item] // item is required
                        && build_results.required[memory_piece.item] > 0 // since last build, still required
                        && inventory[memory_piece.item] >= build_results.required_clean[memory_piece.item] // is item completed now?
                    ) {
                        completed_item = true;
                    }
                }
            }
            // possible to draw more than 1 main drop
            for (const drop of getDrops(quest_id, language)) {
                if (drop.item === constants.placeholder_id) {
                    continue;
                }
                const rng = Math.random() * 100;
                if (rng <= drop.drop_rate) {
                    // item get
                    inventory[drop.item] = (inventory[drop.item]) ? inventory[drop.item] + drop_amount : drop_amount;
                    total_drops[drop.item] = (total_drops[drop.item])
                        ? total_drops[drop.item] + drop_amount : drop_amount;
                    drops[drop.item] = (drops[drop.item]) ? drops[drop.item] + drop_amount : drop_amount;
                    if (build_results.required_clean[drop.item] // item is required
                        && build_results.required[drop.item] > 0 // since last build, still required
                        && inventory[drop.item] >= build_results.required_clean[drop.item] // is item completed now?
                    ) {
                        completed_item = true;
                    }
                }
            }
            // pull only 1 out of all subdrops
            let rng = Math.random() * 100;
            let rate_count = 0;
            for (const drop of getSubdrops(quest_id, language)) {
                if (drop.item === constants.placeholder_id) {
                    continue;
                }
                rate_count += drop.drop_rate;
                if (rng <= rate_count) {
                    // item get
                    inventory[drop.item] = (inventory[drop.item]) ? inventory[drop.item] + drop_amount : drop_amount;
                    total_drops[drop.item] = (total_drops[drop.item])
                        ? total_drops[drop.item] + drop_amount : drop_amount;
                    drops[drop.item] = (drops[drop.item]) ? drops[drop.item] + drop_amount : drop_amount;
                    if (build_results.required_clean[drop.item] // item is required
                        && build_results.required[drop.item] > 0 // since last build, still required
                        && inventory[drop.item] >= build_results.required_clean[drop.item] // is item completed now?
                    ) {
                        completed_item = true;
                    }
                    break;
                }
            }
            // pull only 1 out of all subdrop2s
            rng = Math.random() * 100;
            rate_count = 0;
            for (const drop of getSubdrops2(quest_id, language)) {
                if (drop.item === constants.placeholder_id) {
                    continue;
                }
                rate_count += drop.drop_rate;
                if (rng <= rate_count) {
                    // item get
                    inventory[drop.item] = (inventory[drop.item]) ? inventory[drop.item] + drop_amount : drop_amount;
                    total_drops[drop.item] = (total_drops[drop.item])
                        ? total_drops[drop.item] + drop_amount : drop_amount;
                    drops[drop.item] = (drops[drop.item]) ? drops[drop.item] + drop_amount : drop_amount;
                    if (build_results.required_clean[drop.item] // item is required
                        && build_results.required[drop.item] > 0 // since last build, still required
                        && inventory[drop.item] >= build_results.required_clean[drop.item] // is item completed now?
                    ) {
                        completed_item = true;
                    }
                    break;
                }
            }
            quests.push({
                id: quest_id,
                stamina: stamina_cost,
                total_stamina: stamina,
                drops,
            });
            return completed_item;
        }
    }

    function existsInRegion(id : string, region : Language) : boolean {
        return exists(id) && get(id).name[region] !== undefined;
    }

    return {
        data,
        get,
        name : getName,
        stamina : getStamina,
        memoryPiece : getMemoryPiece,
        drops : getDrops,
        subdrops : getSubdrops,
        subdrops2 : getSubdrops2,
        isNormal,
        isHard,
        isVeryHard,
        isEvent,
        getChapter,
        getNumber,
        getMaxChapter,
        exists,
        build,
        build2,
        search,
        checkForItem,
        estimate,
        existsInRegion,
        questSimulator,
    };
})();