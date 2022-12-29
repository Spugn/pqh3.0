import _data from './data.min.json';
import { constants } from './api';
import * as wanakana from 'wanakana';
import type { CharacterData, Character, Language } from './api.d';

class StaticVariables {
    static max_rank : number = -1;
}

/**
 * manages character data from data.json
 */
export default (() => {
    const data : CharacterData = _data.character;

    /**
     * get character object from character data
     *
     * @param {string} id - character id
     * @returns {Character} - character data
     */
    function get(id : string) : Character {
        return data[id];
    }

    /**
     * get the name of the character. if language is not specified, all names will be returned.
     * if name does not exist for a specific language, JP will be used as a default.
     *
     * @param {string} id - character ID
     * @param {Language} [language] - specific region to get the name from
     * @returns {string | object | undefined} name object, character name defaulting to JP, or undefined if not found
     */
    function getName(id : string, language? : Language) : string | object | undefined {
        if (!data[id]) {
            // character ID not found
            return undefined;
        }
        if (!language) {
            return data[id]?.name;
        }
        return data[id]?.name?.[language] || data[id]?.name?.JP;
    }

    /**
     * get a character's equipment. if rank is not specified, all equipment will be returned.
     * if rank does not exist, undefined will be returned.
     *
     * @param {string} id - character ID
     * @param {number} rank - character rank to get equipment for
     * @returns {string[] | object | undefined} array of item ids, equipment object, or undefined if not found
     */
    function getEquipment(id : string, rank? : number) : string[] | object | undefined {
        if (!data[id]) {
            // character ID not found
            return undefined;
        }
        if (rank === undefined) {
            // return all character equipment if rank is not provided
            return data[id]?.equipment;
        }
        return data[id]?.equipment?.[`rank_${rank}`]
            || [constants.placeholder_id, constants.placeholder_id, constants.placeholder_id,
                constants.placeholder_id, constants.placeholder_id, constants.placeholder_id];
    }

    /**
     * search through all characters for a specific name/id and return an array of unit ids that fit the query.
     *
     * @param {string} query - search query ; i.e. "Miyako", "ミヤ", "야코", etc.
     * @param {boolean} strict - if search should only match exact name
     * @returns {string[]} array of unit ids that fit the query
     */
    function search(query : string, strict? : boolean) : string[] {
        const characters = Object.keys(data);
        if (strict) {
            const found = characters.find(id => {
                const name_obj = getName(id);
                // strict search: only match exact name
                return name_obj && (
                    Object.values(name_obj).some(n => n.toLowerCase() === query.toLowerCase())
                    || `${id}` === query
                );
            });
            return found ? [found] : [];
        }
        return characters.filter(id => {
            const name_obj = getName(id);
            // make sure character names are defined and query is found in any of them, return true
            return name_obj && (
                // standard name check: "Miyako" => [Miyako, Miyako (Halloween), ...]
                Object.values(name_obj).some(n => n.toLowerCase().indexOf(query.toLowerCase()) !== -1)
                // id check: "100701" => [Miyako (100701)]
                || `${id}`.indexOf(query) !== -1
                // hiragana to katakana => "みやこ" => [Miyako, Miyako (Halloween), ...]
                || Object.values(name_obj).some(n => n.indexOf(wanakana.toKatakana(query)) !== -1)
                // romanji to kana => "kyaru" => [Karyl, Karyl (Summer), ...]
                || Object.values(name_obj).some(n => n.indexOf(wanakana.toKana(query)) !== -1)
            );
        });
    }

    /**
     * get the current maximum rank of all characters. some non-JP-exclusive characters may not be able to rank up to
     * this number.
     *
     * @returns {number} maximum rank
     */
    function getMaxRank() : number {
        if (StaticVariables.max_rank === -1) {
            // init max rank
            let max = -1;
            for (const key in data) {
                for (const rank_key in data[key].equipment) {
                    max = Math.max(max, parseInt(rank_key.split("_")[1]));
                }
                // we only care about the first entry, assume everyone else has this max rank
                break;
            }
            StaticVariables.max_rank = max;
        }
        return StaticVariables.max_rank;
    }

    /**
     * check if a character id exists in the data.json file
     *
     * @param {string} id - character id
     * @returns {boolean} true if character exists, false otherwise
     */
    function exists(id : string) : boolean {
        return data[id] !== undefined;
    }

    function existsInRegion(id : string, region : Language) : boolean {
        return exists(id) && get(id).name[region] !== undefined;
    }

    /**
     * get a random unit id (for testing reasons)
     *
     * @returns {string} random unit_id
     */
    function getRandomUnitID() : string {
        const keys = Object.keys(data);
        return keys[keys.length * Math.random() << 0];
    }

    /**
     * get a random character data (for testing reasons)
     *
     * @returns {Character} random character data
     */
    function getRandomCharacter() : Character {
        return data[getRandomUnitID()];
    }

    return {
        data,
        get,
        name : getName,
        equipment : getEquipment,
        search,
        getMaxRank,
        exists,
        existsInRegion,
        getRandomUnitID,
        getRandomCharacter,
    };
})();