import _data from './data.min.json';
import * as wanakana from 'wanakana';
import constants from './constants.api';
import type { EquipmentData, Equipment, Fragment, EquipmentRecipeData, Language, EquipmentCatalog, EquipmentCatalogData } from './api.d';

class StaticVariables {
    static max_rarity : number = -1;
    static catalog : EquipmentCatalog;
}

/**
 * manages equipment data from data.json
 */
export default (() => {
    const data : EquipmentData = _data.equipment;

    /**
     * get equipment object from equipment data
     *
     * @param id - equipment id
     * @returns {Equipment} equipment object, or undefined if it doesn't exist
     */
    function get(id : string) : Equipment {
        return data[id];
    }

    /**
     * get the name of the equipment. if language is not specified, all names will be returned.
     * if name does not exist for a specific language, JP will be used as a default.
     *
     * @param {string} id - equipment id
     * @param {Language} language - language to get the name from
     * @returns {string | object | undefined} name object, equipment name defaulting to JP, or undefined if not found
     */
    function getName(id : string, language? : Language) : string | object | undefined {
        if (!data[id]) {
            // equipment ID not found
            if (isFragment(id)) {
                // equipment ID ended up being a fragment
                return getFragmentName(convertFragmentID(id), language);
            }
            return undefined;
        }
        if (!language) {
            return data[id]?.name;
        }
        return data[id]?.name?.[language] || data[id]?.name?.JP;
    }

    /**
     * get an equipment's rarity. rarity is defined by an equipment's color border.
     *
     * @param {string} id - equipment id
     * @returns {string} rarity ID of the equipment
     */
    function getRarity(id : string) : string {
        return data[id]?.rarity;
    }

    /**
     * get an equipment's fragment. equipment may or may not have a fragment, if this is the case the fragment id
     * will be assigned "unknown" in data.json, but this function will return undefined.
     *
     * @param {string} id - equipment id
     * @returns {Fragment | undefined} fragment object, or undefined if not found or if fragment id equals "unknown"
     */
    function getFragment(id : string) : Fragment | undefined {
        const fragment = data[id]?.fragment;
        return (fragment && fragment.id !== constants.placeholder_id) ? fragment : undefined;
    }

    /**
     * get an equipment's fragment's name. if language is not specified, all names will be returned.
     * if name does not exist for a specific language, JP will be used as a default.
     *
     * @param {string} id - equipment id
     * @param {Language} language - language to get the fragment name from
     * @returns {string | object | undefined} fragment name object, fragment name defaulting to JP, or undefined
     */
    function getFragmentName(id : string, language? : Language) : string | object | undefined {
        const fragment = getFragment(id);
        if (!fragment) {
            // fragment not found or does not exist
            return undefined;
        }
        if (!language) {
            // get all fragment names if language is not provided
            return fragment?.name;
        }
        // return specific language name if it exists, else default to JP
        return fragment?.name?.[language] || fragment?.name?.JP;
    }

    /**
     * get an equipment's fragment id. if the equipment does not have a fragment, the id given will be returned instead.
     *
     * @param {string} id - equipment id
     * @returns {String} - fragment id
     */
    function getFragmentID(id : string) : string {
        return hasFragment(id) ? getFragment(id)!.id : id;
    }

    /**
     * get an equipment's recipe. equipment may or may not have a recipe for a specific language, if this is the case
     * the recipe will default to JP. if no language is provided then all recipes will be returned.
     *
     * @param {string} id - equipment id
     * @param {Language} language - language to get the recipe from
     * @returns {EquipmentRecipeData | undefined} equipment recipe data object or undefined if not found
     */
    function getRecipe(id : string, language : Language) : EquipmentRecipeData {
        if (!data[id]) {
            // equipment ID not found
            return {
                required_pieces: 0,
                required_items: [],
                recipe_note: "UNDEFINED RECIPE",
            };
        }

        // return specific language recipe if it exists, else default to JP
        return data[id]?.recipes?.[language] || data[id]?.recipes?.JP;
    }

    /**
     * searches through equipment data to find a specific item name. an array of equipment ids will be returned as a
     * result. by default, this will search for all names that match the query. if strict is true, only exact matches.
     * fragment name search is not supported here, search for full item name instead and then get fragment details
     * through that.
     *
     * @param {string} query - search query ; i.e. "Iron Blade", "ブレード", "레이", etc.
     * @param {boolean} strict - if true, only exact matches will be returned
     * @returns {string[]} array of equipment ids that fit the query and search settings
     */
    function search(query : string, strict? : boolean) : string[] {
        const equipment = Object.keys(data);
        if (strict) {
            const found = equipment.find(id => {
                const name_obj = getName(id);
                // strict search: only match exact name
                return name_obj && Object.values(name_obj).some(n => n.toLowerCase() === query.toLowerCase()
                    || `${id}` === query
                );
            });
            return found ? [found] : [];
        }
        return equipment.filter(id => {
            const name_obj = getName(id);
            // make sure equipment names are defined and query is found in any of them, return true
            return name_obj && (
                // standard name check: "Iron Blade" => [Iron Blade]
                Object.values(name_obj).some(n => n.toLowerCase().indexOf(query.toLowerCase()) !== -1)
                // id check: "101011" => [Iron Blade (101011)]
                || `${id}`.indexOf(query) !== -1
                // hiragana to katakana => "あいあん" => [Iron Blade]
                || Object.values(name_obj).some(n => n.indexOf(wanakana.toKatakana(query)) !== -1)
                // romanji to kana => "aian" => [Iron Blade]
                || Object.values(name_obj).some(n => wanakana.toRomaji(n).indexOf(query) !== -1)
            );
        });
    }

    /**
     * check if an equipment id exists in the data.json file
     *
     * @param {string} id - equipment id
     * @returns {boolean} true if equipment exists, false otherwise
     */
    function exists(id : string) : boolean {
        return data[id] !== undefined;
    }

    /**
     * check if an equipment exists in a specific region
     *
     * @param {string} id - equipment id
     * @param {Language} region - game region or language to use
     * @returns {boolean} - true if exists, false otherwise
     */
    function existsInRegion(id : string, region : Language) : boolean {
        if (exists(id)) {
            // full item
            return get(id).name[region] !== undefined;
        }
        // fragment or invalid
        else if (isFragment(id)) {
            return get(convertFragmentID(id))?.name[region] !== undefined;
        }
        return false;
    }

    /**
     * check if a given equipment id is a full item.
     *
     * @param {string} id - equipment id
     * @returns {boolean} true if equipment is a full item, false otherwise
     */
    function isFullItem(id : string) : boolean {
        // full items usually have a "0" as their 2nd character in their id
        // memory pieces are considered full items and have a 5 digit id and no "0" as their 2nd character
        // full item ids are usually the key in data.json, so we can just use that to check
        return id !== "" && id.length >= 5 && exists(id);
    }

    /**
     * check if a given equipment id is a fragment.
     *
     * @param {string} id - equipment id
     * @returns {boolean} true if equipment is a fragment, false otherwise
     */
    function isFragment(id : string) : boolean {
        // fragments usually don't have a "0" as their 2nd character in their id
        // fragments also usually have a 6 digit id
        // can just check if the 2nd character is not "0", but to be more "secure"
        // about it, we'll convert from fragment id to full item id and check if it exists
        return id !== "" && id.length >= 6 && id[1] !== "0" && exists(convertFragmentID(id));
    }

    /**
     * convert a given fragment id to a full item id. by default, this will check if the end result
     * is an actual full item id (if not it will return "unknown"), but if the no_verify flag is set
     * then the conversion will be done without checking if the result is a full item id.
     *
     * @param {string} id - fragment id
     * @param {boolean} no_verify if true, conversion will be checked if it's a full item id
     * @returns {string} full item id, or "unknown" if resulting id is not a full item
     */
    function convertFragmentID(id : string, no_verify? : boolean) : string {
        // check for valid id before converting
        if (id === "" || id.length < 5) {
            // invalid id provided
            return constants.placeholder_id;
        }

        if (id.length === 5 && !no_verify) {
            // probably a memory piece, just check without doing any conversions
            return isFullItem(id) ? id : constants.placeholder_id;
        }

        // convert fragment id to full item id by changing 2nd character to be a "0"
        const new_id = `${id.substring(0, 1)}0${id.substring(2)}`;
        if (no_verify) {
            return new_id;
        }

        // verify that the fragment id is valid first ; if not, return undefined
        return isFullItem(new_id) ? new_id : constants.placeholder_id;
    }

    /**
     * gets the rarity value from an equipment id. this has no real checking,
     * so an incorrect rarity may be provided.
     *
     * @param id - equipment id
     * @returns {string | undefined} rarity id, or "-1" if invalid id
     */
    function getRarityFromID(id : string) : string {
        if (id === "" || id.length < 3 || id === constants.placeholder_id) {
            return "-1";
        }
        if (id.length === 5) {
            if (isFullItem(id)) {
                // memory piece, get rarity from data if it exists
                const memory_piece = data[id];
                return memory_piece?.rarity;
            }
            // invalid memory piece
            return "-1";
        }
        if (id.length >= 8) {
            // for equipment_10000000 and higher
            return `${parseInt(`${id}`.substring(2, 3)) + 10}`;
        }
        // for regular 6 digit equipment ids
        return id[2];
    }

    /**
     * check if a full item has a fragment (assigned fragment id is not "unknown")
     *
     * @param {string} id - equipment id
     * @returns {boolean} true if full item has a fragment, false otherwise
     */
    function hasFragment(id : string) : boolean {
        return isFullItem(id) && data[id].fragment.id !== constants.placeholder_id;
    }

    /**
     * get a random item_id from data (for testing reasons)
     *
     * @returns {string} item_id
     */
    function getRandomItem() : string {
        const keys = Object.keys(data);
        return keys[keys.length * Math.random() << 0];
    }

    /**
     * find (if haven't already) and return the highest item rarity in data (excluding "99", which is misc items).
     *
     * @returns {number} highest max rarity
     */
    function getMaxRarity() : number {
        if (StaticVariables.max_rarity === -1) {
            // init max rank
            let max = -1;
            for (const key in data) {
                const rarity = parseInt(data[key].rarity);
                if (rarity !== 99 && rarity > max) {
                    max = rarity;
                }
            }
            StaticVariables.max_rarity = max;
        }
        return StaticVariables.max_rarity;
    }

    function getCatalog() : EquipmentCatalog {
        if (!StaticVariables.catalog) {
            let result : EquipmentCatalog = {
                all: {},
                full: {},
                fragment: {},
            };
            for (const key in data) {
                const rarity = getRarity(key);
                const full_data : EquipmentCatalogData = {
                    id: key,
                    full_id: key,
                    is_fragment: false,
                    rarity,
                };
                const fragment_data : EquipmentCatalogData = {
                    id: getFragmentID(key),
                    full_id: key,
                    is_fragment: true,
                    rarity,
                };

                if (!result.all[rarity]) result.all[rarity] = {};
                result.all[rarity][full_data.id] = full_data;
                if (!result.full[rarity]) result.full[rarity] = {};
                result.full[rarity][full_data.id] = full_data;
                if (fragment_data.id !== constants.placeholder_id) {
                    if (!result.fragment[rarity]) result.fragment[rarity] = {};
                    result.all[rarity][fragment_data.id] = fragment_data;
                    result.fragment[rarity][fragment_data.id] = fragment_data;
                }
            }
            StaticVariables.catalog = result;
        }
        return StaticVariables.catalog;
    }

    return {
        data,
        get,
        name : getName,
        rarity : getRarity,
        fragment : getFragment,
        fragmentName : getFragmentName,
        fragmentID : getFragmentID,
        recipe : getRecipe,
        search,
        exists,
        existsInRegion,
        isFullItem,
        isFragment,
        convertFragmentID,
        getRarityFromID,
        hasFragment,
        getRandomItem,
        getMaxRarity,
        getCatalog,
    };
})();
