import { equipment, character } from './api';
import type {
    EquipmentRecipeData, Recipe, Inventory, Project, IgnoredRarities, Language, ProjectCheckStatus,
    ProjectProgressResult, CharacterProject, ItemProject
} from './api.d';

/**
 * manages handling project objects
 */
export default (() => {
    /**
     * goes through all required (full) items from a project (or object masking as a project) and then figures out
     * how many fragments the project needs to be completed.
     *
     * @param {Project} project - character or item project
     * @param {Inventory} inv - user inventory object
     * @param {Language} language - game region to take recipe from
     * @param {IgnoredRarities} ignored_rarities - item rarities to ignore during build
     * @returns {Recipe} recipe object containing required fragment ids (key) and their amount (value)
     */
    function build(
        project : Project,
        inv : Inventory,
        language : Language = "UNKNOWN",
        ignored_rarities : IgnoredRarities = {}
    ) : Recipe {
        const _inv = JSON.parse(JSON.stringify(inv)); // copy inventory so it won't be modified
        const result : Recipe = {};
        for (const id in project.required) {
            recursive(id, project.required[id]);
        }
        return result;

        /**
         * helper function, takes an item and modifies result and inventory as needed
         *
         * @param {string} id - full item id
         * @param {number} amount - amount of full items to add to result
         */
        function recursive(id : string, amount : number) {
            const item_recipe : EquipmentRecipeData = equipment.recipe(id, language);
            const fragment_id : string = equipment.fragmentID(id);
            if (_inv[id] && !ignored_rarities[equipment.rarity(id)]) {
                // inventory is currently holding pre-built full versions of this item
                result[id] = amount - _inv[id];
                if (result[id] <= 0) {
                    // we're done here, inventory has more than needed so no need to determine fragments/required items
                    result[id] = amount; // set result to inventory amount consumed
                    _inv[id] -= amount; // subtract from inventory
                    return;
                }
                // add full items from inventory to result (this means less fragments compared to no inventory usage)
                result[id] = _inv[id]; // set result to amount of full items we already had
                amount -= _inv[id]; // subtract from full items we already had
                _inv[id] = 0; // set inventory to 0, since we used it up
            }

            // don't add this item's fragments if its rarity is ignored or if it doesn't need fragments
            // (items like Sorcerer Glasses (103613) has no fragments)
            if (!ignored_rarities[equipment.rarity(id)] && item_recipe.required_pieces > 0) {
                result[fragment_id] = (item_recipe.required_pieces * amount) + (result[fragment_id] || 0);
            }

            // go through required items
            if (!ignored_rarities[equipment.rarity(id)]) {
                for (const required_id of item_recipe.required_items) {
                    recursive(required_id, amount);
                }
            }
        }
    }

    /**
     * checks a user's inevntory to see if they have enough items to build the given project.
     *
     * @param {Project} project - character or item project
     * @param {Inventory} inv - user inventory object
     * @param {Language} language - game region to take recipe from
     * @param {IgnoredRarities} ignored_rarities - item rarities to ignore during build
     * @returns {ProjectCheckStatus} project check status containing details if a user can complete a project or not
     */
    function check(
        project : Project,
        inv : Inventory,
        language : Language = "UNKNOWN",
        ignored_rarities : IgnoredRarities = {}
    ) : ProjectCheckStatus {
        const time_key = `api.project#check: (${language} | ${project.date})`;
        console.time(time_key);
        const result = build(project, inv, language, ignored_rarities);
        const result_copy = JSON.parse(JSON.stringify(result)); // copy results to return later
        for (const id in result) {
            result[id] -= inv[id] || 0;
            if (result[id] <= 0) {
                delete result[id];
            }
        }
        console.timeEnd(time_key);
        return {
            success: Object.keys(result).length <= 0,
            remaining: result,
            recipe: result_copy,
        };
    }

    /**
     * consumes the required items from the user's inventory to build the given project.
     * this will not modify the inventory directory, this will return a new inventory object.
     * this also ignores if the inventory has enough items to build the project.
     * if you want to check and consume the inventory, use `project.check()` before `project.consume()`.
     *
     * @param {Project} project - character or item project
     * @param {Inventory} inv - user inventory object
     * @param {Language} language - game region to take the recipe from
     * @param {IgnoredRarities} ignored_rarities - item rarities to ignore during build
     * @returns {Inventory} modified inventory object
     */
    function consume(
        project : Project,
        inv : Inventory,
        language : Language = "UNKNOWN",
        ignored_rarities : IgnoredRarities = {}
    ) : Inventory {
        const time_key = `api.project#consume: (${language} | ${project.date})`;
        console.time(time_key);
        const _inv = JSON.parse(JSON.stringify(inv)); // copy inventory so it won't be modified
        const result = build(project, inv, language, ignored_rarities);
        for (const id in result) {
            _inv[id] -= result[id];
            if (_inv[id] <= 0 || isNaN(_inv[id])) {
                delete _inv[id];
            }
        }
        console.timeEnd(time_key);
        return _inv;
    }

    /**
     * go through an array of project objects to create a collection of required items.
     *
     * @param {Project[]} projects - array of enabled project objects to combine all requried items for
     * @returns {Recipe} compiled required items from all projects
     */
    function compile(projects : Project[]) : Recipe {
        const result : Recipe = {};
        for (const project of projects) {
            for (const id in project.required) {
                result[id] = (result[id] || 0) + project.required[id];
            }
        }
        return result;
    }

    function progress(
        project : Project,
        inv : Inventory,
        language : Language = "UNKNOWN",
        ignored_rarities : IgnoredRarities = {}
    ) : ProjectProgressResult {
        const check_result = check(project, inv, language, ignored_rarities);
        const result = {
            progress: -1,
            items: {
                current: 0,
                max: 0,
            },
            fragments: {
                current: 0,
                max: 0,
            },
            check: check_result,
        };

        // count full recipe
        for (const key in check_result.recipe) {
            result.items.max++; // unique item
            result.fragments.max += check_result.recipe[key]; // fragment
        }

        if (check_result.success) {
            // there's no more remaining, so just assume 100% completion
            result.progress = 100;
            result.items.current = result.items.max;
            result.fragments.current = result.fragments.max;
            return result;
        }

        // count remaining
        for (const key in check_result.remaining) {
            result.items.current++; // unique item
            result.fragments.current += check_result.remaining[key]; // fragment
        }
        result.items.current = result.items.max - result.items.current;
        result.fragments.current = result.fragments.max - result.fragments.current;

        result.progress = parseFloat(((result.fragments.current / result.fragments.max) * 100).toFixed(2));

        return result;
    }

    function getTestCharacterProject(items : number = 0) : CharacterProject {
        const required : Recipe = {};
        if (items > 0) {
            for (let i = 0 ; i < items && Object.keys(required).length < items ; i++) {
                required[equipment.getRandomItem()] = 10;
            }
        }
        const unit = character.getRandomCharacter();
        const end_rank = Math.floor(Math.random() * character.getMaxRank()) + 1;
        const start_rank = Math.floor(Math.random() * end_rank) + 1;
        return {
            type: "character",
            date: Date.now(),
            priority: false,
            details: {
                avatar_id: unit.id,
                formal_name: `${unit.name.JP} (${unit.id})`,
                name: unit.name.JP,
                start: {
                    rank: start_rank,
                    equipment: getRandomEquipped(),
                },
                end: {
                    rank: end_rank,
                    equipment: getRandomEquipped(),
                },
                memory_piece: 0,
                pure_memory_piece: 0,
                ignored_rarities: {
                    "1": Math.random() < 0.5,
                    "2": Math.random() < 0.5,
                    "3": Math.random() < 0.5,
                    "4": Math.random() < 0.5,
                    "5": Math.random() < 0.5,
                    "6": Math.random() < 0.5,
                    "7": Math.random() < 0.5,
                    "8": Math.random() < 0.5,
                },
            },
            required,
        };

        function getRandomEquipped() : [boolean, boolean, boolean, boolean, boolean, boolean] {
            return [
                Math.random() < 0.5,
                Math.random() < 0.5,
                Math.random() < 0.5,
                Math.random() < 0.5,
                Math.random() < 0.5,
                Math.random() < 0.5,
            ];
        }
    }

    function getTestItemProject(items : number = 0) : ItemProject {
        const required : Recipe = {};
        if (items > 0) {
            for (let i = 0 ; i < items && Object.keys(required).length < items ; i++) {
                required[equipment.getRandomItem()] = 10;
            }
        }
        return {
            type: "item",
            date: Date.now(),
            priority: false,
            details: {
                name: "Untitled Project",
                ignored_rarities: {
                    "1": Math.random() < 0.5,
                    "2": Math.random() < 0.5,
                    "3": Math.random() < 0.5,
                    "4": Math.random() < 0.5,
                    "5": Math.random() < 0.5,
                    "6": Math.random() < 0.5,
                    "7": Math.random() < 0.5,
                    "8": Math.random() < 0.5,
                },
            },
            required,
        };
    }

    return {
        build,
        check,
        consume,
        compile,
        progress,
        getTestCharacterProject,
        getTestItemProject,
    };
})();