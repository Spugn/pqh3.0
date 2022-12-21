import type { Recipe, Inventory } from './api.d';
import constants from './constants.api';

/**
 * handles inventory manipulation (adding, removing, setting)
 */
export default (() => {
    /**
     * get an inventory object and then search for an item id in it and return the amount that
     * exists in inventory, or 0 if it does not exist.
     *
     * @param {Inventory} inv - inventory object
     * @param {string} id - equipment id, can be full item or fragment
     * @returns {number} amount in inventory
     */
    function get(inv : Inventory, id : string) {
        return inv[id] || 0;
    }

    /**
     * take an inventory object and then add a item id and amount to it.
     * if the new amount is less than or equal to 0, the item will be deleted from inventory instead.
     * if the new amount is greater than the max amount, the amount will be set to the max amount.
     *
     * @param {Inventory} inv - inventory object
     * @param {string} id - equipment id, can be full item or fragment
     * @param {number} amount - amount to add to the inventory
     * @returns {Inventory} modified inventory
     */
    function add(inv : Inventory, id : string, amount : number) : Inventory {
        const current = inv[id] || 0;
        const new_amount = current + amount;
        if (new_amount <= 0) {
            // new value is 0 or less, remove item from inventory
            delete inv[id];
            return inv;
        }
        inv[id] = (new_amount >= constants.inventory.max.fragment) ? constants.inventory.max.fragment : new_amount;
        return inv;
    }

    /**
     * take an inventory object and then subtract items from it.
     * not providing a quantity will delete the item entirely from inventory.
     * if the new quantity is lower than or equal to 0, item will be removed from inventory.
     * if the new amount is greater than the max amount, the amount will be set to the max amount.
     *
     * @param {Inventory} inv - inventory object
     * @param {string} id - equipment id, can be full item or fragment
     * @param {number} amount - optional: if provided, subtract that amount; else delete item from inventory
     * @returns {Inventory} modified inventory
     */
    function remove(inv : Inventory, id : string, amount? : number) : Inventory {
        if (!amount) {
            // no amount provided, delete all
            delete inv[id];
            return inv;
        }
        const current = inv[id] || 0;
        const new_amount = current - amount;
        if (new_amount <= 0) {
            // new value is 0 or less, remove item from inventory
            delete inv[id];
            return inv;
        }
        inv[id] = (new_amount >= constants.inventory.max.fragment) ? constants.inventory.max.fragment : new_amount;
        return inv;
    }

    /**
     * take an inventory object and then set the quantity of an item to be a specific amount.
     * if the provided amount is less than or equal to 0, the item will be deleted from inventory instead.
     * if the new amount is greater than the max amount, the amount will be set to the max amount.
     *
     * @param {Inventory} inv - inventory object
     * @param {string} id - equipment id, can be full item or fragment
     * @param {number} amount - amount to set the item in inventory to
     * @returns {Inventory} modified inventory
     */
    function set(inv : Inventory, id : string, amount : number) : Inventory {
        if (amount <= 0) {
            // items can't be set if amount is 0 or less
            delete inv[id];
            return inv;
        }
        inv[id] = (amount >= constants.inventory.max.fragment) ? constants.inventory.max.fragment : amount;
        return inv;
    }

    /**
     * take an inventory and recipe object and then subtract the items that exist in recipe from the inventory.
     * this is primarily used for "completing" projects, where the user gets items deducted from their inventory.
     *
     * @param {Inventory} inv - inventory object
     * @param {Recipe} recipe - recipe object, preferably a large one from a project
     * @returns {Inventory} modified inventory
     */
    function removeRecipe(inv : Inventory, recipe : Recipe) : Inventory {
        for (let id in recipe) {
            if (inv.hasOwnProperty(id)) {
                inv = remove(inv, id, recipe[id]);
            }
        }
        return inv;
    }

    return {
        get,
        add,
        remove,
        set,
        removeRecipe,
    };
})();
