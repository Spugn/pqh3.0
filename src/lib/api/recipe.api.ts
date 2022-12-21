import type { Recipe, Language, IgnoredRarities } from './api.d';
import equipment from './equipment.api';

/**
 * handles the building of "compiled" equipment recipes and merging them
 */
export default (() => {
    /**
     * build the item's compiled recipe, which is an object with item ids as keys and the value being the required
     * amount.
     *
     * example recipe for "105225" (Abyss Moon Staff - Sacrifice | 月淵杖サクリファイス):
     * {
     *   "115225": 90,    // Abyss Moon Staff - Sacrifice Fragment
     *   "124224": 45,    // High Devil Wand Fragment
     *   "114221": 30,    // Fury Rod Fragment
     *   "114611": 45,    // Mourning Crescent Moon Fragment
     * }
     *
     * @param {string} item_id - equipment id
     * @param {number} amount - amount to craft
     * @param {Language} language - langauge/server's recipe to use, defaults to JP
     * @param {IgnoredRarities} ignored_rarities - object of rarity ids to ignore
     * @returns {Recipe} decompiled item recipe
     */
    function build(item_id : string, amount : number, language? : Language, ignored_rarities : IgnoredRarities = {}) : Recipe {
        if ((!equipment.isFullItem(item_id) && !equipment.isFragment(item_id)) || amount <= 0) {
            // item is (not a full item or fragment) or amount is 0 or less
            return {};
        }
        if (!language) {
            // no language specified, use default (JP)
            language = "JP";
        }
        if (equipment.isFragment(item_id)) {
            // item_id appears to be a fragment id. check if item rarity is blacklisted.
            // if blacklisted, return empty recipe, else return recipe for fragment.
            return ignored_rarities[equipment.getRarityFromID(item_id)] ? {} : { [item_id] : amount };
        }

        // all item_ids beyond this point are assumed valid full item ids.
        const item_data = equipment.get(item_id);
        const item_recipe = equipment.recipe(item_id, language);

        let result : Recipe = {}; // resulting recipe is stored here

        // add fragments to recipe if rarity is not ignored and there is more than 0 required pieces
        if (!ignored_rarities[item_data.rarity] && item_recipe.required_pieces > 0) {
            const key = equipment.hasFragment(item_id) ? item_data.fragment.id : item_data.id;
            result[key] = item_recipe.required_pieces * amount;
        }

        // add required item recipes to result
        if (!ignored_rarities[item_data.rarity]) {
            for (const required_item_id of item_recipe.required_items) {
                result = merge(result, build(required_item_id, amount, language, ignored_rarities));
            }
        }

        return result;
    }

    /**
     * take any number of recipe objects and merge them into a single recipe object.
     * if a recipe has a common item component, the amounts will be added together.
     *
     * example usage: recipe.merge(recipe_1, recipe_2, recipe_3, ...);
     *
     * @param {Recipe[]} recipes - array of recipes to merge
     * @returns {Recipe} merged recipe
     */
    function merge(...recipes : Recipe[]) : Recipe {
        return recipes.reduce((a, b) => {
            for (let f in b) {
                if (b.hasOwnProperty(f)) {
                    a[f] = (a[f] || 0) + b[f];
                }
            }
            return a;
        }, {});
    }

    return {
        build,
        merge,
    };
})();