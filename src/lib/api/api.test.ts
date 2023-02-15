import { character, equipment, quest, recipe, inventory, project, constants, user } from './api';
import { describe, test, expect, beforeEach } from 'vitest';
import type { Project, Recipe } from './api.d';

describe("character api", () => {
    let results : string[];
    test("data", () => {
        expect(character.data).toBeTruthy(); // data must exist
    });
    test("get", () => {
        expect(character.get("")).toBeFalsy(); // invalid id
        expect(character.get("100701")).toBeTruthy(); // valid id
    });
    test("search", () => {
        results = character.search("Miyako");
        expect(results.length).toBeGreaterThanOrEqual(1); // 1+ results is expected
    });
    test("search#strict", () => {
        results = character.search("Miyako", true);
        expect(results.length).toBe(1); // strict search Miyako
        expect(results[0]).toBe("100701"); // Miyako's id "100701"
        expect(character.search("", true).length).toBeLessThanOrEqual(0); // strict search with invalid query
    });
    test("name (getName)", () => {
        expect(character.name(results[0])).toBeTruthy(); // all names
        expect(character.name(results[0], "EN")).toBe("Miyako"); // only EN name
        expect(character.name("")).toBeFalsy(); // invalid name
        expect(character.name(results[0], "UNKNOWN")).toBe("ミヤコ"); // default to JP
    });
    /*
    test("equipment (getEquipment)", () => {
        expect(character.equipment(results[0])).toBeTruthy(); // all equipment
        expect(character.equipment(results[0], 1)).toBeTruthy(); // rank_1
        expect(character.equipment("", 1)).toBeFalsy(); // invalid character id
        expect(character.equipment(results[0], 0)).toBeFalsy(); // invalid rank (< 1)
        expect(character.equipment(results[0], Number.MAX_VALUE)).toBeFalsy(); // invalid rank (number max value)
    });
    */
    test("getMaxRank", () => {
        expect(character.getMaxRank()).toBeGreaterThan(-1) // should at least be changed from default of -1
    });
    test("exists", () => {
        expect(character.exists(results[0])).toBeTruthy(); // valid id ; exists
        expect(character.exists("")).toBeFalsy(); // invalid id
    });
});

describe("equipment api", () => {
    test("data", () => {
        expect(equipment.data).toBeTruthy(); // data must exist
    });
    test("get", () => {
        expect(equipment.get("")).toBeFalsy(); // invalid id
        expect(equipment.get("101011")).toBeTruthy(); // valid id ; full item
        expect(equipment.get("122282")).toBeFalsy(); // valid id ; fragment
    });
    test("name (getName)", () => {
        expect(equipment.name("")).toBeFalsy(); // invalid id
        expect(equipment.name("101011")).toBeTruthy(); // valid id, getting all names
        expect(equipment.name("101011", "EN")).toBe("Iron Blade"); // valid id, getting EN name
        expect(equipment.name("101011", "UNKNOWN")).toBe("アイアンブレード"); // default to JP
    });
    test("rarity (getRarity)", () => {
        expect(equipment.rarity("")).toBeFalsy(); // invalid id
        expect(equipment.rarity("101011")).toBe("1"); // valid id, checking value
    });
    test("fragment (getFragment)", () => {
        expect(equipment.fragment("")).toBeFalsy(); // invalid id
        expect(equipment.fragment("101011")).toBeFalsy(); // valid id, but fragment does not exist
        expect(equipment.fragment("102282")).toBeTruthy(); // valid id and fragment exists
    });
    test("fragmentName (getFragmentName)", () => {
        expect(equipment.fragmentName("")).toBeFalsy(); // invalid id
        expect(equipment.fragmentName("101011")).toBeFalsy(); // valid id, but fragment does not exist
        expect(equipment.fragmentName("102282")).toBeTruthy(); // valid id and fragment exists
        expect(equipment.fragmentName("102282", "EN")).toBe("Light Plate Armor Blueprint"); // getting EN name only
        expect(equipment.fragmentName("102282", "UNKNOWN")).toBe("ライトプレートの設計図"); // default to JP
    });
    test("fragmentID (getFragmentID)", () => {
        expect(equipment.fragmentID("")).toBe(""); // invalid id
        expect(equipment.fragmentID("101011")).toBe("101011"); // valid id, but fragment does not exist
        expect(equipment.fragmentID("102282")).toBe("122282"); // valid id and fragment exists
    });
    test("recipe (getRecipe)", () => {
        expect(equipment.recipe("", "EN")).toEqual({
            required_pieces: 0,
            required_items: [],
            recipe_note: "UNDEFINED RECIPE",
        }); // invalid id
        expect(equipment.recipe("101011", "JP")).toBeTruthy(); // valid id ; JP recipe
        expect(equipment.recipe("101011", "UNKNOWN")).toBeTruthy(); // default to JP
    });
    test("search", () => {
        expect(equipment.search("a").length).toBeGreaterThanOrEqual(1); // 1+ results is expected
    });
    test("search#strict", () => {
        expect(equipment.search("Iron Blade", true).length).toBe(1); // 1 results is expected
        expect(equipment.search("", true).length).toBeLessThanOrEqual(0); // 0 results is expected
    });
    test("exists", () => {
        expect(equipment.exists("101011")).toBeTruthy(); // valid id ; exists
        expect(equipment.exists("")).toBeFalsy(); // invalid id
    });
    test("isFullItem", () => {
        expect(equipment.isFullItem("")).toBeFalsy(); // invalid id
        expect(equipment.isFullItem("101011")).toBeTruthy(); // valid id ; full item
        expect(equipment.isFullItem("32075")).toBeTruthy(); // valid id ; memory piece
        expect(equipment.isFullItem("122282")).toBeFalsy(); // valid id ; fragment
        expect(equipment.isFullItem("999999")).toBeFalsy(); // placeholder id
    });
    test("isFragment", () => {
        expect(equipment.isFragment("")).toBeFalsy(); // invalid id
        expect(equipment.isFragment("101011")).toBeFalsy(); // valid id ; full item
        expect(equipment.isFragment("32075")).toBeFalsy(); // valid id ; memory piece
        expect(equipment.isFragment("122282")).toBeTruthy(); // valid id ; fragment
        expect(equipment.isFragment("999999")).toBeFalsy(); // placeholder id
    });
    test("convertFragmentID", () => {
        expect(equipment.convertFragmentID("")).toBe("unknown"); // invalid id
        expect(equipment.convertFragmentID("101011")).toBe("101011"); // valid id ; full item
        expect(equipment.convertFragmentID("32075")).toBe("32075"); // valid id ; memory piece
        expect(equipment.convertFragmentID("122282")).toBe("102282"); // valid id ; fragment
        expect(equipment.convertFragmentID("999999")).toBe("unknown"); // "valid" id, but converts poorly
        expect(equipment.convertFragmentID("99999")).toBe("unknown"); // "valid" id ; memory piece
    });
    test("convertFragmentID#no_verify", () => {
        expect(equipment.convertFragmentID("", true)).toBe("unknown"); // invalid id
        expect(equipment.convertFragmentID("101011", true)).toBe("101011"); // valid id ; full item
        expect(equipment.convertFragmentID("32075", true)).toBe("30075"); // valid id ; memory piece
        expect(equipment.convertFragmentID("122282", true)).toBe("102282"); // valid id ; fragment
        expect(equipment.convertFragmentID("999999", true)).toBe("909999"); // "valid" id, but converts poorly
        expect(equipment.convertFragmentID("99999", true)).toBe("90999"); // "valid" id ; memory piece
    });
    test("getRarityFromID", () => {
        expect(equipment.getRarityFromID("")).toBe("-1"); // invalid id
        expect(equipment.getRarityFromID("101011")).toBe("1"); // valid id ; full item
        expect(equipment.getRarityFromID("32075")).toBe("99"); // valid id ; memory piece
        expect(equipment.getRarityFromID("122282")).toBe("2"); // valid id ; fragment
        expect(equipment.getRarityFromID("unknown")).toBe("-1"); // placeholder id
        expect(equipment.getRarityFromID("99999")).toBe("-1"); // placeholder id ; invalid memory piece
    });
    test("hasFragment", () => {
        expect(equipment.hasFragment("")).toBeFalsy(); // invalid id
        expect(equipment.hasFragment("101011")).toBeFalsy(); // valid id ; full item with no fragment
        expect(equipment.hasFragment("32075")).toBeFalsy(); // valid id ; memory piece
        expect(equipment.hasFragment("102282")).toBeTruthy(); // valid id ; full item with fragment
        expect(equipment.hasFragment("122282")).toBeFalsy(); // valid id ; fragment
        expect(equipment.hasFragment("999999")).toBeFalsy(); // placeholder id
    });
});

describe("quest api", () => {
    test("get", () => {
        expect(quest.get("")).toBeFalsy(); // invalid id
        expect(quest.get("1-1")).toBeTruthy(); // valid id
    });
    test("name (getName)", () => {
        expect(quest.name("")).toBeFalsy(); // invalid id
        expect(quest.name("1-1")).toBeTruthy(); // valid id
        expect(quest.name("1-1", "JP")).toBeTruthy(); // valid id, with language
        expect(quest.name("1-1", "UNKNOWN")).toBeTruthy(); // valid id, unknown language
        expect(quest.name("1-1", "JP")).toEqual(quest.name("1-1", "UNKNOWN")); // unknown language defaults to JP
    });
    test("stamina (getStamina)", () => {
        expect(quest.stamina("")).toBeFalsy(); // invalid id
        expect(quest.stamina("1-1")).toBeTruthy(); // valid id
        expect(quest.stamina("1-1", "JP")).toBeTruthy(); // valid id, with language
        expect(quest.stamina("1-1", "UNKNOWN")).toBeTruthy(); // valid id, unknown language
        expect(quest.stamina("1-1", "JP")).toEqual(quest.stamina("1-1", "UNKNOWN")); // unknown language defaults to JP
    });
    test("memoryPiece (getMemoryPiece)", () => {
        expect(quest.memoryPiece("", "JP")).toBeFalsy(); // invalid id
        expect(quest.memoryPiece("1-1", "JP")).toBeFalsy(); // valid id, but has no memory piece
        expect(quest.memoryPiece("1-1H", "JP")).toBeTruthy(); // valid id and has memory piece
        expect(quest.memoryPiece("1-1", "UNKNOWN")).toBeFalsy(); // valid id, unknown language, no memory piece
        expect(quest.memoryPiece("1-1H", "UNKNOWN")).toBeTruthy(); // valid id, unknown language, memory piece
        expect(quest.memoryPiece("1-1", "JP")).toEqual(quest.memoryPiece("1-1", "UNKNOWN")); // unknown language default to JP
        expect(quest.memoryPiece("1-1H", "JP")).toEqual(quest.memoryPiece("1-1H", "UNKNOWN")); // unknown language default to JP
    });
    test("drops (getDrops)", () => {
        expect(quest.drops("", "JP").length).toBeLessThanOrEqual(0); // invalid id, must return an empty array
        expect(quest.drops("", "UNKNOWN").length).toBeLessThanOrEqual(0); // invalid id, unknown language, must return an empty array
        expect(quest.drops("1-1", "JP")).toBeTruthy(); // valid id
        expect(quest.drops("1-1", "UNKNOWN")).toBeTruthy(); // valid id, unknown language
        expect(quest.drops("1-1", "JP")).toEqual(quest.drops("1-1", "UNKNOWN")); // unknown language default to JP
    });
    test("subdrops (getSubdrops)", () => {
        expect(quest.subdrops("", "JP").length).toBeLessThanOrEqual(0); // invalid id, must return an empty array
        expect(quest.subdrops("", "UNKNOWN").length).toBeLessThanOrEqual(0); // invalid id, unknown language, must return an empty array
        expect(quest.subdrops("1-1", "JP")).toBeTruthy(); // valid id
        expect(quest.subdrops("1-1", "UNKNOWN")).toBeTruthy(); // valid id, unknown language
        expect(quest.subdrops("1-1", "JP")).toEqual(quest.subdrops("1-1", "UNKNOWN")); // unknown language default to JP
    });
    test("isNormal", () => {
        expect(quest.isNormal("")).toBeFalsy(); // invalid id
        expect(quest.isNormal("1-1")).toBeTruthy(); // valid id ; normal quest
        expect(quest.isNormal("1-1H")).toBeFalsy(); // valid id ; hard quest
        expect(quest.isNormal("1-1VH")).toBeFalsy(); // valid id ; very hard quest
        expect(quest.isNormal("1-1E")).toBeFalsy(); // valid id ; event quest
    });
    test("isHard", () => {
        expect(quest.isHard("")).toBeFalsy(); // invalid id
        expect(quest.isHard("1-1")).toBeFalsy(); // valid id ; normal quest
        expect(quest.isHard("1-1H")).toBeTruthy(); // valid id ; hard quest
        expect(quest.isHard("1-1VH")).toBeFalsy(); // valid id ; very hard quest
        expect(quest.isHard("1-1E")).toBeFalsy(); // valid id ; event quest
    });
    test("isVeryHard", () => {
        expect(quest.isVeryHard("")).toBeFalsy(); // invalid id
        expect(quest.isVeryHard("1-1")).toBeFalsy(); // valid id ; normal quest
        expect(quest.isVeryHard("1-1H")).toBeFalsy(); // valid id ; hard quest
        expect(quest.isVeryHard("1-1VH")).toBeTruthy(); // valid id ; very hard quest
        expect(quest.isVeryHard("1-1E")).toBeFalsy(); // valid id ; event quest
    });
    test("isEvent", () => {
        expect(quest.isEvent("")).toBeFalsy(); // invalid id
        expect(quest.isEvent("1-1")).toBeFalsy(); // valid id ; normal quest
        expect(quest.isEvent("1-1H")).toBeFalsy(); // valid id ; hard quest
        expect(quest.isEvent("1-1VH")).toBeFalsy(); // valid id ; very hard quest
        expect(quest.isEvent("1-1E")).toBeTruthy(); // valid id ; event quest
    });
    test("getChapter", () => {
        expect(quest.getChapter("3-6")).toBe(3); // normal quest
        expect(quest.getChapter("2-1H")).toBe(2); // hard quest
        expect(quest.getChapter("7-2VH")).toBe(7); // very hard quest
        expect(quest.getChapter("16-3E")).toBe(16); // event quest
    });
    test("getNumber", () => {
        expect(quest.getNumber("3-6")).toBe(6); // normal quest
        expect(quest.getNumber("2-1H")).toBe(1); // hard quest
        expect(quest.getNumber("7-2VH")).toBe(2); // very hard quest
        expect(quest.getNumber("16-3E")).toBe(3); // event quest
    });
    test("getMaxChapter", () => {
        expect(quest.getMaxChapter()).toBeGreaterThan(-1) // should at least be changed from default of -1
    });
    test("exists", () => {
        expect(quest.exists("1-1")).toBeTruthy(); // valid id ; exists
        expect(quest.exists("")).toBeFalsy(); // invalid id
    });
    test("build", () => {
        const all_projects : Project[] = [];
        const compiled_items : Recipe = {};

        // no items
        let result = quest.build({
            all_projects, compiled_items,
            inventory:{},
            settings:{},
            use_inventory:false,
            language:"JP"
        });
        expect(result.quest_scores.length).toBe(0); // cant have quests w/ no items

        // add 1 item
        all_projects.push({ required: { "101011": 5 } });
        compiled_items["101011"] = 5;
        result = quest.build({
            all_projects, compiled_items,
            inventory:{},
            settings:{},
            use_inventory:false,
            language:"JP"
        });
        expect(result.quest_scores.length).toBeGreaterThan(0);

        // use inventory
        result = quest.build({
            all_projects, compiled_items,
            inventory:{
                "101011": 2,
            },
            settings:{},
            use_inventory:true,
            language:"JP"
        });
        expect(result.required).toEqual({ "101011": 3 }); // subtracted from inventory
        expect(result.required_clean).toEqual({ "101011": 5 }); // uneffected from inventory

        // add priority project with different items from original project
        all_projects.push({ priority: true, required: { "101071": 10 } });
        compiled_items["101071"] = 10;
        result = quest.build({
            all_projects, compiled_items,
            inventory:{},
            settings:{},
            use_inventory:false,
            language:"JP"
        });
        expect(result.priority_items).toEqual(["101071"]); // item from priority project
        expect(result.priority_amount).toEqual({ "101071": 10 }); // amount of priority items needed

        // invalid equipment id exists in project required for some reason
        all_projects.push({ priority: true, required: { "999999": 1 } });
        result = quest.build({
            all_projects, compiled_items,
            inventory:{},
            settings:{},
            use_inventory:false,
            language:"JP"
        });
        expect(result.priority_items).toEqual(["101071"]); // priority items should be same as previous run
        expect(result.priority_amount).toEqual({ "101071": 10 }); // priority amount should be same as well
    });
    test("search", () => {
        const required : Recipe = {
            "101011": 1,
            "116042": 1, // random item that's in a VH quest not in chapter 18
        };
        const priority_items : string[] = [];

        // testing quest chapter filter
        let result = quest.search({
            required, priority_items,
            settings:{
                chapter: {
                    min: 999999,
                    max: 999999,
                },
            },
            language:"JP",
        });
        expect(result.length).toBeLessThanOrEqual(0); // all quests should be ignored

        // testing disabled difficulties
        result = quest.search({
            required, priority_items,
            settings:{
                chapter: {
                    min: 18,
                    max: 18,
                },
                disabled_difficulty: {
                    "Normal": true,
                    "Hard": true,
                    "Very Hard": true,
                    "Event": true,
                }
            },
            language:"JP",
        });
        expect(result.length).toBe(0);

        // testing item filter
        result = quest.search({
            required, priority_items,
            settings:{
                item_filter: ["101011"],
            },
            language:"JP",
        });
        console.log(result);
        expect(result.length).toBeGreaterThan(0);

        // testing event multipliers
        result = quest.search({
            required, priority_items,
            settings:{
                drop_buff: {
                    "Normal": 1,
                    "Hard": 1,
                    "Very Hard": 1,
                }
            },
            language:"JP",
        });
        expect(result.length).toBeGreaterThan(0);

        // testing alternate sort options
        result = quest.search({
            required, priority_items,
            settings:{
                sort: {
                    score: true,
                    list: true,
                }
            },
            language:"JP",
        });
        expect(result.length).toBeGreaterThan(0);
    });
    test("checkForItem", () => {
        // checking faulty item_id
        expect(quest.checkForItem("999999", "1-1", "JP")).toBeFalsy();

        // checking memory piece
        expect(quest.checkForItem("31059", "1-1H", "JP")).toBeTruthy();
    });
    /*
    test("estimate", () => {
        // random item estimate
        expect(quest.estimate({ "101011": 1 })).toBeGreaterThan(0);

        // estimated quests > 100 (max)
        expect(quest.estimate({
            "32058": 1,
            "101011": 1,
            "101281": 1,
            "125286": 1,
            "116582": 1,
            "116552": 1,
        })).toBeGreaterThanOrEqual(100);
    });
    */
});

describe("recipe api", () => {
    test("build", () => {
        expect(recipe.build("", 1)).toEqual({}); // invalid id, valid amount
        expect(recipe.build("101011", -1)).toEqual({}); // valid id, invalid amount
        expect(recipe.build("101011", 1)).toEqual({ "101011": 1 }); // valid id, valid amount
        expect(recipe.build("101011", 25)).toEqual({ "101011": 25 }); // valid id, different amount
        expect(recipe.build("101011", 1, "JP", {"1": true})).toEqual({}); // valid, but ignored rarity
        expect(recipe.build("122282", 10)).toEqual({
            "122282": 10,
        }); // valid id ; fragment
        expect(recipe.build("122282", 1, "JP", {"2": true})).toEqual({}); // valid fragment, ignored rarity
        expect(recipe.build("122282", 1, "JP", {"1": true})).toEqual({
            "122282": 1,
        }); // valid fragment, blacklist but not ignored rarity
        expect(Object.keys(recipe.build("105225", 1)).length).toBe(4); // valid, more complex recipe
    });

    test("merge", () => {
        const recipe_1 = { "1" : 1 };
        const recipe_2 = { "2" : 5 };
        const recipe_3 = { "3" : 10, "1" : 1 };
        expect(recipe.merge(recipe_1)).toEqual(recipe_1); // solo merge
        expect(recipe.merge(recipe_1, recipe_2)).toEqual({
            "1" : 1,
            "2" : 5,
        }); // merge 2 recipes
        expect(recipe.merge(recipe_1, recipe_2, recipe_3)).toEqual({
            "1": 2,
            "2": 5,
            "3": 10,
        }); // merge 3 recipes
    });
});

describe("inventory api", () => {
    let test_inventory = {};

    beforeEach(() => {
        test_inventory = {
            "1": 5,
            "2": 10,
            "3": 15
        };
    });

    test("add", () => {
        expect(inventory.add(test_inventory, "1", 1)).toEqual({
            "1": 6, "2": 10, "3": 15,
        }); // return value of inventory
        expect(test_inventory).toEqual({
            "1": 6, "2": 10, "3": 15,
        }); // inventory must be modified too, despite not saving return value
        expect(inventory.add(test_inventory, "1", -10)).toEqual({
            "2": 10, "3": 15,
        }); // add -10, "1" should be removed
        expect(inventory.add(test_inventory, "1", -20)).toEqual({
            "2": 10, "3": 15,
        }); // add -20, "1" should still not be inventory
        expect(inventory.add(test_inventory, "4", 20)).toEqual({
            "2": 10, "3": 15, "4": 20
        }); // add item that didnt exist prior
        expect(inventory.add(test_inventory, "5", -25)).toEqual({
            "2": 10, "3": 15, "4": 20
        }); // add a negative quantity item that didnt exist prior, should not exist
        expect(inventory.add(test_inventory, "2", constants.inventory.max.fragment + 100)).toEqual({
            "2": constants.inventory.max.fragment, "3": 15, "4": 20
        }); // adding above the max amount should set the amount equal to max amount
    });

    test("remove", () => {
        expect(inventory.remove(test_inventory, "1", 1)).toEqual({
            "1": 4, "2": 10, "3": 15,
        }); // return value of inventory
        expect(test_inventory).toEqual({
            "1": 4, "2": 10, "3": 15,
        }); // inventory must be modified too, despite not saving return value
        expect(inventory.remove(test_inventory, "1", 10)).toEqual({
            "2": 10, "3": 15,
        }); // remove 10, "1" should be removed
        expect(inventory.remove(test_inventory, "1", 20)).toEqual({
            "2": 10, "3": 15,
        }); // remove 20, "1" should still not be inventory
        expect(inventory.remove(test_inventory, "2")).toEqual({
            "3": 15,
        }); // no quantity provided, remove "2" completely
        expect(inventory.remove(test_inventory, "3", -10)).toEqual({
            "3": 25,
        }); // remove a negative quantity
        expect(inventory.remove(test_inventory, "4", 10)).toEqual({
            "3": 25,
        }); // remove an item that didnt exist prior ; amount provided
        expect(inventory.remove(test_inventory, "5")).toEqual({
            "3": 25,
        }); // remove a item that still didnt exist ; no amount provided
        expect(inventory.remove(test_inventory, "6", -30)).toEqual({
            "3": 25, "6": 30,
        }); // removing a negative quantity on an item that did not exist.
        expect(inventory.remove(test_inventory, "3", -(constants.inventory.max.fragment + 100))).toEqual({
            "3": constants.inventory.max.fragment, "6": 30,
        }); // removing a negative quantity above the max amount should set the amount equal to max amount
    });

    test("set", () => {
        expect(inventory.set(test_inventory, "1", 100)).toEqual({
            "1": 100, "2": 10, "3": 15,
        }); // return value of inventory
        expect(test_inventory).toEqual({
            "1": 100, "2": 10, "3": 15,
        }); // inventory must be modified too, despite not saving return value
        expect(inventory.set(test_inventory, "1", -100)).toEqual({
            "2": 10, "3": 15,
        }); // setting a negative value, "1" should be removed
        expect(inventory.set(test_inventory, "4", -100)).toEqual({
            "2": 10, "3": 15,
        }); // setting a negative value to a item that did not exist
        expect(inventory.set(test_inventory, "4", 50)).toEqual({
            "2": 10, "3": 15, "4": 50
        }); // set a value to an item that did not exist
        expect(inventory.set(test_inventory, "2", constants.inventory.max.fragment + 100)).toEqual({
            "2": constants.inventory.max.fragment, "3": 15, "4": 50
        }); // set a value above the max amount should equal the max amount
    });

    test("removeRecipe", () => {
        expect(inventory.removeRecipe(
            { // inventory =====
                ...test_inventory,
                "5": 25, // add "5" to test what happens if an object isn't a part of recipe
            },
            { // recipe ========
                "1": 1000, // test if item is greater than existing inv amount
                "2": 5,    // test if item is lower than existing inv amount
                "3": 15,   // test if item equals existing inv amount
                "4": 10,   // test if item doesn't exist in inventory
            }
        )).toEqual({
            "1": undefined, // must no longer exist
            "2": 5,         // 10 (inventory) - 5 (recipe) = 5 (new inventory amount)
            "3": undefined, // must no longer exist
            "4": undefined, // shouldn't exist
            "5": 25,        // uneffected by recipe, so should be same as initial inventory
        });
    });
});

describe("project api", () => {
    let character_project = {
        type: "character",
        date: Date.now(),
        priority: false,
        details: {
            avatar_id: "999999",
            formal_name: "EXAMPLE (999999)",
            name: "EXAMPLE",
            start: { rank: 1, equipment: [], },
            end: { rank: 1, equipment: [], },
            memory_piece: 0,
            pure_memory_piece: 0,
            ignored_rarities: {},
        },
        required: {},
    };
    let item_project = {
        type: "item",
        date: Date.now(),
        priority: false,
        details: {
            name: "EXAMPLE",
            ignored_rarities: {},
        },
        required: {},
    };

    beforeEach(() => {
        character_project.required = {
            "31002": 20, // memory piece
            "101011": 5, // item with no fragment
            "102282": 2, // item with fragment
        };
        item_project.required = {
            "31003": 10, // memory piece
            "101011": 1, // item with no fragment
            "102282": 1, // item with fragment
            "102311": 2, // item with fragment that doesnt exist in character project
        };
    });

    test("build", () => {
        expect(project.build(character_project, {}, "JP", {})).toEqual({ // no inventory, no ignored rarities
            "31002": 20, // memory piece (same amount)
            "101011": 5, // item with no fragment (same amount)
            "122282": 2, // item with fragment -> fragment
            "102281": 2, // compiled recipe from required item from 102282
        });
        expect(project.build(character_project, { // inventory, no ignored rarities
            "102282": 1,
        }, "JP", {})).toEqual({
            "31002": 20, // unchanged
            "101011": 5, // unchanged
            "102282": 1, // full item taken from inventory
            "122282": 1, // -1 since 1 full item is already taken from inventory
            "102281": 1, // parent item got (-1), so -1 here too
        });
        expect(project.build(character_project, {}, "JP", { // no inventory, ignored rarities
            "2": true, // ignore "copper" rarity
        })).toEqual({
            "31002": 20, // not ignored, rarity "99"
            "101011": 5, // not ignored, rarity "1"
        });
        expect(project.build(character_project, { // inventory, ignored rarities
            "102282": 10,
        }, "JP", {
            "99": true, // ignore "misc" rarity
        })).toEqual({
            "101011": 5, // not ignored, rarity "1"
            "102282": 2, // not ignored (rarity "2"), exists in inventory so use full item instead of components
        });
    });

    test("check", () => {
        expect(project.check(character_project, {}, "JP", {})).toEqual({ // no inventory, no ignored rarities
            success: false,
            remaining: {
                "31002": 20, // memory piece (same amount)
                "101011": 5, // item with no fragment (same amount)
                "122282": 2, // item with fragment -> fragment
                "102281": 2, // compiled recipe from required item from 102282
            },
            recipe: {
                "31002": 20, // memory piece (same amount)
                "101011": 5, // item with no fragment (same amount)
                "122282": 2, // item with fragment -> fragment
                "102281": 2, // compiled recipe from required item from 102282
            },
        });
        expect(project.check(character_project, { // inventory, no ignored rarities
            "31002": 10,
            "102282": 1,
        }, "JP", {})).toEqual({
            success: false,
            remaining: {
                "31002": 10, // subtracted from inventory
                "101011": 5, // same amount, not in inventory
                "122282": 1, // -1 full item from inventory
                "102281": 1, // -1 because 1x parent item exists
            },
            recipe: {
                "31002": 20, // memory piece (same amount)
                "101011": 5, // item with no fragment (same amount)
                "102282": 1, // full item consumption from inventory
                "122282": 1, // item with fragment -> fragment
                "102281": 1, // compiled recipe from required item from 102282
            },
        });
        expect(project.check(character_project, {}, "JP", { // no inventory, ignored rarities
            "1": true,
        })).toEqual({
            success: false,
            remaining: {
                "31002": 20, // not ignored (rarity "99")
                "122282": 2, // not ignored (rarity "2")
                "102281": 2, // not ignored (rarity "2")
            },
            recipe: {
                "31002": 20, // memory piece (same amount)
                "122282": 2, // item with fragment -> fragment
                "102281": 2, // compiled recipe from required item from 102282
            },
        });
        expect(project.check(character_project, { // inventory, ignored rarities
            "31002": 10,
            "101011": 10, // more items than project needs
            "102282": 1, // item ignored but exists anyways
        }, "JP", {
            "2": true,
        })).toEqual({
            success: false,
            remaining: {
                "31002": 10, // subtracted from inventory
            },
            recipe: {
                "31002": 20, // memory piece (same amount)
                "101011": 5, // item with no fragment (same amount)
            },
        });
        expect(project.check(character_project, { // inventory, ignored rarities, completed project
            "31002": 20, // just enough items, but ignored
            "101011": 10, // more items than project needs
            "102282": 2, // just enough items
        }, "JP", {
            "99": true,
        })).toEqual({
            success: true,
            remaining: {},
            recipe: {
                "101011": 5, // memory piece (same amount)
                "102282": 2, // item with fragment, taken from inventory
            },
        });
    });

    test("consume", () => {
        expect(project.consume(character_project, {}, "JP", {})).toEqual({}); // no inventory, no ignored rarities
        expect(project.consume(character_project, { // inventory, no ignored rarities
            "102282": 1,
            "999999": 100,
        }, "JP", {})).toEqual({
            "999999": 100, // item should still exist because not consumed
        });
        expect(project.consume(character_project, {}, "JP", { // no inventory, ignored rarities
            "2": true, // ignore "copper" rarity
        })).toEqual({});
        expect(project.consume(character_project, { // inventory, ignored rarities
            "31002": 5, // less items than needed
            "101011": 5, // just enough items as needed, but ignored
            "102282": 10, // more items than needed
        }, "JP", {
            "1": true, // ignore "common" rarity
        })).toEqual({
            "101011": 5, // ignored, should have same amount as starting inventory
            "102282": 8, // subtracted from project usage (-2)
        });
    });

    test("compile", () => {
        expect(project.compile([character_project])).toEqual({ // compile 1 project
            "31002": 20, // memory piece
            "101011": 5, // item with no fragment
            "102282": 2, // item with fragment
        });
        expect(project.compile([character_project, item_project])).toEqual({ // compile 2 projects
            "31002": 20, // memory piece
            "101011": 6, // item with no fragment
            "102282": 3, // item with fragment
            "31003": 10, // memory piece that didnt exist in character project
            "102311": 2, // item with fragment that didnt exist in character project
        });
    });
});

describe("user api", () => {
    test("get", () => { // get test needs to go first because testing what happens if user_state isnt init yet
        expect(user.get()).toBeTruthy(); // initial run
        expect(user.get()).toBeTruthy(); // get value after init
    });
    test("init", () => {
        // localstorage already init from get() call earlier
        user.init(); // load saved localstorage result from previous init
        expect(user.get()).toBeTruthy();
        user._toggle_localstorage(); // localstorage = not enabled
        user.init(); // trying "no localstorage" test
        expect(user.get()).toBeTruthy();
        user._toggle_localstorage(); // reset to localstorage = enabled
    });
    test("save", () => {
        user._toggle_localstorage(); // localstorage = not enabled
        user.save(); // trying "no localstorage" test
        user._toggle_localstorage(); // reset to localstorage = enabled
    });
    test("inventory.set", () => {
        user.inventory.set({ "101011": 10, });
        expect(user.inventory.get()).toEqual({
            "101011": 10,
        });
    });
    test("inventory.setAmount", () => {
        user.inventory.setAmount("101011", -1); // setting negative amount = delete item
        expect(user.inventory.get()).toEqual({}); // inventory is empty (had items from previous test)
        user.inventory.setAmount("101011", 10); // setting valid amount
        expect(user.inventory.get()).toEqual({
            "101011": 10,
        });
        user.inventory.setAmount("101011", constants.inventory.max.fragment + 1); // setting amount greater than max
        expect(user.inventory.get()).toEqual({
            "101011": constants.inventory.max.fragment,
        });
    });
    test("inventory.getAmount", () => {
        expect(user.inventory.getAmount("101011")).toEqual(constants.inventory.max.fragment);
        expect(user.inventory.getAmount("item_id")).toEqual(0); // item that inventory doesn't have
    });
    test("inventory.remove", () => {
        user.inventory.remove("101011");
        expect(user.inventory.getAmount("101011")).toEqual(0);
    });
    test("character.set", () => {
        user.character.set({
            "unit_id": {
                id: "unit_id",
                rank: 1,
                equipment: [false, false, false, false, false, false],
            },
        });
    });
    test("character.get", () => {
        expect(user.character.get()).toEqual({
            "unit_id": {
                id: "unit_id",
                rank: 1,
                equipment: [false, false, false, false, false, false],
            },
        });
    });
    test("settings.set", () => {
        user.settings.set("setting_key", "setting-value");
    });
    test("settings.get", () => {
        expect(user.settings.get()["setting_key"]).toEqual("setting-value")
    });
    test("projects.set", () => {
        user.projects.set({
            "1": {
                type: "character",
                date: 1,
                priority: false,
                details: {
                    avatar_id: "unit_id",
                    formal_name: "Formal Name",
                    name: "Project Name",
                    start: {
                        rank: 1,
                        equipment: [false, false, false, false, false, false],
                    },
                    end: {
                        rank: 2,
                        equipment: [false, false, false, false, false, false],
                    },
                    memory_piece: 0,
                    pure_memory_piece: 0,
                    ignored_rarities: {},
                },
                required: {
                    "101011": 5,
                },
            },
        });
    });
    test("projects.replace", () => {
        const proj = {
            type: "character",
            date: 1,
            priority: false,
            details: {
                avatar_id: "unit_id",
                formal_name: "Formal Name",
                name: "Project Name",
                start: {
                    rank: 1,
                    equipment: [false, false, false, false, false, false],
                },
                end: {
                    rank: 2,
                    equipment: [false, false, true, false, false, false], // changed from initial
                },
                memory_piece: 1,
                pure_memory_piece: 1,
                ignored_rarities: {},
            },
            required: {
                "101011": 10,
            },
        };
        user.projects.replace(2, proj); // project id (date) "2" doesn't exist
        user.projects.replace(1, proj); // project 1d (date) "1" does exist
    });
    test("projects.delete", () => {
        user.projects.delete(2); // project id "2" doesn't exist
        user.projects.delete(1); // deleted project 1 successfully
    });
    /*
    test("projects.complete", () => {
        const proj = {
            type: "character",
            date: 1,
            priority: false,
            details: {
                avatar_id: "100701",
                formal_name: "Formal Name",
                name: "example project",
                start: {
                    rank: 1,
                    equipment: [false, false, false, false, false, false],
                },
                end: {
                    rank: 2,
                    equipment: [true, true, true, true, false, false],
                },
                memory_piece: 0,
                pure_memory_piece: 0,
                ignored_rarities: {},
            },
            required: {
                "101011": 5,
            }
        };
        user.projects.complete(proj); // project doesnt exist in user yet, quits early

        // consume=false, save=false
        user.projects.add(proj);
        user.projects.complete(proj);
        expect(user.projects.get().length).toEqual(0);

        // consume=true, save=false
        user.projects.add(proj);
        user.inventory.setAmount("101011", 10);
        user.projects.complete(proj, { consume: true });
        expect(user.projects.get().length).toEqual(0);
        expect(user.inventory.getAmount("101011")).toEqual(5); // -5 from init amount due to project

        // consume=false, save=true
        user.projects.add(proj);
        user.projects.complete(proj, { save: true });
        expect(user.projects.get().length).toEqual(0);
        expect(user.character.get()["100701"]).toEqual({
            id: "100701",
            rank: 2,
            equipment: [true, true, true, true, false, false],
        });

        // consume=true, save=true (with existing character now)
        proj.details.end = {
            rank: 5,
            equipment: [false, true, false, true, false, true],
        }
        user.projects.add(proj);
        user.projects.complete(proj, { consume: true, save: true });
        expect(user.projects.get().length).toEqual(0);
        expect(user.character.get()["100701"]).toEqual({
            id: "100701",
            rank: 5,
            equipment: [false, true, false, true, false, true],
        });
        expect(user.inventory.getAmount("101011")).toEqual(0); // -5 from the 5 we had in inventory
    });
    */
});