const _CONSTANTS = Object.freeze({
    DATA_LOCATION: `${process.env.PUBLIC_URL}/data.min.json`, // used in Main.js, points to which data file to read
    DIFFICULTY: Object.freeze(["Normal", "Hard", "Very Hard", "Event"]), // used in quest settings
    RARITY: Object.freeze(["1", "2", "3", "4", "5", "6", "7", "8"]), // used in quest settings
    INVENTORY: Object.freeze({ // used in anywhere that changes inventory
        FULL_MAX: 99,
        FRAGMENT_MAX: 9999,
    }),
    QUEST: Object.freeze({
        STEP: 10, // start amount of quests displayed and how much per quest refresh
    }),
    PAGE_CATEGORIES: Object.freeze({ // used in Main.js
        HOME: 'home',
        CHARACTERS: 'characters',
        INVENTORY: 'inventory',
        SETTINGS: 'settings',
    }),
});
const MODAL_STYLE = Object.freeze({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'rgb(228 228 231)',
    color: 'black',
    boxShadow: 4,
    borderRadius: 1,
    maxHeight: '100%',
    overflow: 'auto',
    p: 4,
});
const INIT_USER_STATE = Object.freeze({
    inventory: Object.freeze({
        /*
        "101011": 5,
        */
    }),
    character: Object.freeze({
        /*
        "100701": {
            equipment: [false, false, false, false, false, false],
            id: "100701",
            rank: 1
        },
        */
    }),
    projects: Object.freeze([
        /*
        {
            type: "character",
            date: `${Date.now()}`, // used as a project id
            priority: false,
            details: {
                avatar_id: "100701",
                formal_name: "ミヤコ (100701)",
                name: "sample character name", // optional
                start: {
                    rank: 1,
                    equipment: [false, false, false, false, false, false],
                },
                end: {
                    rank: 1,
                    equipment: [false, false, false, false, false, false],
                },
                memory_piece: 1,
                pure_memory_piece: 1,
                ignored_rarity: { "1": true, "2": true, },
            },
            required: { // full items only in required, fragments calculated later
                "101011": 5,
                "107341": 2,
            }
        },
        {
            type: "item",
            date: `${Date.now() + 1}`, // used as a project id
            priority: false,
            details: {
                name: "sample item name", // required
                ignored_rarity: { "1": true, "2": true, },
            },
            required: { // full items only in required, fragments calculated later
                "101011": 5,
                "107341": 2,
            }
        },
        */
    ]),
    settings: Object.freeze({
        alert: {
            /*
            miyakoMenuTip: true,
            */
        },
        quest: {
            /*
            chapter: {
                min: 1,
                max: 50,
                auto_max: false,
            },
            disabled_difficulty: {
                "Hard": true,
            },
            drop_buff: {
                "Normal": 3, // 3x
            },
            ignored_rarity: {
                "1": true,
                "5": true,
            },
            item_filter: [
                "122431",
                "102011",
            ],
            sort: {
                list: true, // if true, sort by descending order
                score: true, // if true, sort by ascending order
            },
            */
        },
        /*
        use_legacy: true,
        */
    }),
});
const INIT_DATA_STATE = Object.freeze({
    character: {
        data: {},
        max_rank: -1, // -1 means uninitialized
    },
    equipment: {
        data: {},
    },
    quest: {
        data: {},
        max_chapter: -1, // -1 means uninitialized
    },
});
export default _CONSTANTS;
export { MODAL_STYLE, INIT_USER_STATE, INIT_DATA_STATE };