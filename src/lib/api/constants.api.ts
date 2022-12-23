/**
 * constant variables
 */
import type { DropBuffOption, RegionOption } from './api.d';
export default (() => {
    const menu_items = Object.freeze({ // used for burger menu
        home: Object.freeze({
            id: "home",
            text: "Home",
        }),
        characters: Object.freeze({
            id: "characters",
            text: "Characters",
        }),
        inventory: Object.freeze({
            id: "inventory",
            text: "Inventory",
        }),
        settings: Object.freeze({
            id: "settings",
            text: "Settings",
        }),
    });
    const inventory = Object.freeze({
        max: Object.freeze({
            full: 99, // max amount for projects
            fragment: 9999, // max amount for inventory
        }),
    });
    const placeholder_id = "999999"; // item and character placeholder id
    const difficulty = Object.freeze({ // quest difficulties
        hard: "H",
        very_hard: "VH",
        event: "E"
    });
    const multiplier = Object.freeze({ // quest score multiplier
        priority: 2.0, // priority quests
    });
    const default_user_state = Object.freeze({
        inventory: Object.freeze({}),
        character: Object.freeze({}),
        projects: Object.freeze({}),
        settings: Object.freeze({
            quest: Object.freeze({}),
        }),
    });
    const region_options : RegionOption[] = [
        { language: "JP", text: "Japan (JP)" },
        { language: "CN", text: "China (CN)" },
        { language: "EN", text: "English (EN)" },
        { language: "KR", text: "Korea (KR)" },
        { language: "TW", text: "Taiwan (TW)" },
    ];
    const drop_buff_options : DropBuffOption[] = [
        // value needs to be string otherwise there will be issue with selects
        { value: "1", text: "x1" },
        { value: "2", text: "x2" },
        { value: "3", text: "x3" },
        { value: "4", text: "x4" },
    ];
    const quest_card_color = Object.freeze({
        green: {
            color: "from-green-300",
            score: 7.2,
        },
        yellow: {
            color: "from-yellow-300",
            score: 3.6,
        },
        red: {
            color: "from-red-300",
        },
        getGradient: (score : number) => {
            return "bg-gradient-to-r " + (score >= quest_card_color.green.score
                ? quest_card_color.green.color
                : score >= quest_card_color.yellow.score
                    ? quest_card_color.yellow.color
                    : quest_card_color.red.color);
        },
    });
    const legacy_localstorage_key = "userState"
    const localstorage_key = "userState_v2";
    const max_priority_level = 10;
    return {
        menu_items,
        inventory,
        placeholder_id,
        difficulty,
        multiplier,
        default_user_state,
        legacy_localstorage_key,
        localstorage_key,
        region_options,
        drop_buff_options,
        quest_card_color,
        max_priority_level,
    };
})();