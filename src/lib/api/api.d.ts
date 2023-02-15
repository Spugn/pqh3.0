interface Data {
    readonly character: CharacterData; // characters and their required equipment
    readonly equipment: EquipmentData; // equipments and their fragments/recipes
    readonly quest: QuestData; // quests and their rewards/stamina costs
}

interface CharacterData {
    readonly [id: string]: Character; // unit_id ; i.e. "100701"
}

interface Character {
    readonly id: string; // unit_id ; i.e. "100701"
    readonly name: { // collection of unit names for eachs erver
        readonly [language: string]: string // i.e. "EN": "Miyako"
    };
    readonly equipment: { // collection of required rank equipment for the character
        readonly [rank : string]: string[]; // rank_# : [item_id, item_id, ...]
    };
}

interface EquipmentData {
    readonly [id: string]: Equipment; // item_id ; i.e. "101011"
}

interface Equipment {
    readonly id: string; // item_id ; i.e. "101011"
    readonly name: { // collection of item names for each server
        readonly [language: string]: string // i.e. "EN": "Iron Blade"
    };
    readonly rarity: string; // i.e. "1" (common), "2" (copper), ... "99" (misc)
    readonly fragment: Fragment;
    readonly recipes: { // collection of different recipes for the item, depends on server because costs may vary
        readonly [language : string]: EquipmentRecipeData
    };
}

interface QuestData {
    readonly [id: string]: Quest; // quest_id ; i.e. "1-1" (normal), "1-1H" (hard), "1-1VH" (very hard), "1-1E" (event)
}

interface Quest {
    readonly name: { // collection of quest names for each server
        readonly [language : string]: string // i.e. "EN": "Juno Plains 1-1"
    };
    readonly stamina: { // collection of stamina requirements for each server
        readonly [language : string]: number // required stamina to start the quest
    };
    readonly drop_table: { // collection of quest drops for each server
        readonly [language : string]: { // i.e. "JP"
            readonly memory_piece: QuestItem; // memory piece details
            readonly drops: QuestItem[]; // array of objects containing details of "main" quest drops
            readonly subdrops: QuestItem[]; // array of objects containing details of "sub" quest drops
        }
    };
}

interface Fragment { // fragment object in equipment data
    readonly id: string; // fragment_id ; i.e. "122282" ; will be "unknown" if does not exist
    readonly name: { // collection of fragment names for each server
        readonly [key : string]: string; // "language": "name" i.e. "EN": "Light Plate Armor Blueprint"
    };
}

interface EquipmentRecipeData { // equipment recipe data object in equipment data
    readonly required_pieces: number;// required number of fragments to create 1 full item
    readonly required_items: string[]; // array of item_ids required to create 1 full item ; i.e. ["101011", "101012"]
    readonly recipe_note: string; // basic comment about the recipe, usually just the server it's for
}

interface QuestItem { // quest item object in quest data
    readonly item: string; // item_id ; i.e. "101011" ; if does not exist, will be "unknown"
    readonly drop_rate: number; // drop rate of the item ; if does not exist, will be 0
}

interface Recipe { // compiled recipe object
    [item_id : string]: number; // i.e. "101011": 100
}

interface Inventory { // user inventory object, can contain full or fragment items
    [item_id : string]: number;
}

interface CharacterProject { // project for building a specific character
    readonly type : "character" | string; // character project type
    readonly date : number; // result from `Date.now()`, used as project id
    priority : boolean; // priority project flag
    partially_completed? : boolean; // partially completed flag, means user has removed items from required
    details: {
        readonly avatar_id: string; // for avatar image (i.e. "100701")
        readonly formal_name: string; // permanent project name (i.e. "ミヤコ (100701)")
        name?: string; // optional, user provided project name
        start: RankDetails; // starting details
        end: RankDetails; // ending details
        memory_piece: number; // number of regular memory pieces requested
        pure_memory_piece: number; // number of pure memory pieces requested
        ignored_rarities: IgnoredRarities; // item rarities to ignore
        priority_level?: number; // 2 by default if this doesn't exist and project is priority
    };
    required: Recipe; // only full items, fragments are calculated later (NOTHING FILTERED YET EITHER)
}

interface ItemProject { // project containing a random assortment of items
    readonly type: "item" | string; // item project type
    readonly date: number; // result from `Date.now()`, used as project id
    priority: boolean; // priority project flag
    partially_completed? : boolean; // partially completed flag, means user has removed items from required
    all_item_project? : boolean; // flag for if this project is an "All Projects" project
    details: {
        name?: string; // required project name
        ignored_rarities: IgnoredRarities; // item rarities to ignore
        priority_level?: number; // 2 by default if this doesn't exist and project is priority
    };
    required: Recipe; // only full items, fragments are calculated later (NOTHING FILTERED YET)
}

interface BasicProject { // project format excluding the details, use if want to test project without the details
    readonly date?: number | string; // result from `Date.now()`, used as project id
    type?: string; // project type
    priority?: boolean; // priority project flag
    details?: {
        name?: string; // project name
        ignored_rarities?: IgnoredRarities; // item rarities to ignore
        priority_level?: number; // 2 by default if this doesn't exist and project is priority
    };
    required: Recipe; // only full items, fragments are calculated later (NOTHING FILTERED YET)
}

interface IgnoredRarities { // object containing rarities that should be ignored
    [rarity_id : string]: boolean; // flag for if the rarity should be enabled (i.e. "1": true)
}

interface RankDetails { // character project start or end rank details
    rank: number; // character starting or ending rank
    equipment: [boolean, boolean, boolean, boolean, boolean, boolean]; // flag if an equipment slot is equipped or not
}

interface ProjectCheckStatus {
    success: boolean; // true if user has enough items to build project, false otherwise
    remaining: Recipe; // recipe object containing only missing items
    recipe: Recipe; // recipe object containing all items
}

type Language = "JP" | "CN" | "EN" | "KR" | "TW" | "UNKNOWN"; // available language/region codes

type Project = CharacterProject | ItemProject | BasicProject;

interface Projects {
    [project_id : string] : Project; // project_id is a copy of the project date
};

type ProjectType = "character" | "item"; // available project types

interface QuestScore {
    id : string; // quest id, e.g. "1-1", "2-1H", "10-1VH", "3-1E"
    score : number; // quest score, higher value being a more valuable quest to farm
};

interface Settings {
    quest? : QuestSettings;
    region? : Language;
    hide_content? : boolean; // hide unreleased content from character/item catalogs
    compact_project_cards? : boolean; // have smaller project cards so project list can display more
    auto_enable_projects? : boolean; // enable projects at startup/creation?
    keep_enabled_projects? : {
        enabled: boolean;
        projects: { [date : string] : boolean }; // array of enabled project id/dates
    }; // keep the enabled/disabled state of projects
    inventory_alternative_mode? : boolean; // display inventory page in an alternative way
    simulator_stamina_overlay? : boolean; // enable quest simulator stamina overlay
    simulator_dont_use_inventory? : boolean; // use inventory when calculating stamina for overlay
    project_sort? : {
        date : "asc" | "desc";
        priority : "desc" | "asc" | "none";
        unit_id : "none" | "asc" | "desc";
        type : "none" | "desc" | "asc";
        enabled : "none" | "desc" | "asc";
        [type : string] : string;
    }; // project sort options
    session_ignored_rarities? : {
        [rarity : string] : boolean;
    }; // Session ignored rarities, used in creating projects, etc
    display_all_project? : boolean; // display the "all projects" project, which is a compilation of all items
    all_project_first? : boolean; // display the "all projects" project first in project list no matter what
    all_project_ignored_rarities? : IgnoredRarities;
    [key : string] : unknown;
};

interface QuestSettings {
    chapter? : {
        min : number;
        max : number;
        auto_max? : boolean; // flag to auto set to highest chapter as soon as it comes out
    };
    disabled_difficulty? : {
        [difficulty : string] : boolean;
    };
    item_filter? : string[]; // array of item ids
    drop_buff? : {
        [difficulty : string] : number;
    };
    sort? : {
        list? : boolean; // sort by quest list (value), ascending=false|descending=true
        score? : boolean; // sort by quest score, ascending=true|descending=false
    };
    ignored_rarities?: {
        [rarity : string] : boolean;
    };
};

interface SavedCharacter {
    id : string;
    rank : number;
    equipment : [boolean, boolean, boolean, boolean, boolean, boolean];
};

interface SavedCharacters {
    [unit_id : string] : SavedCharacter;
};

interface UserState {
    inventory : Inventory;
    character : SavedCharacters;
    projects : Projects;
    settings : Settings;
};

interface ProjectProgressResult {
    progress : number;
    items: {
        current : number;
        max : number;
    };
    fragments: {
        current : number;
        max : number;
    };
    check: ProjectCheckStatus;
};

interface SessionProjects {
    [date : string] : {
        enabled : boolean;
        edited : number;
        project : Project;
    }
};

interface EquipmentCatalogData {
    id : string;
    full_id : string;
    is_fragment : boolean;
    rarity: string;
};

interface EquipmentCatalog {
    all: { // all items
        [rarity_id : string] : {
            [item_id : string] : EquipmentCatalogData;
        };
    };
    full : { // full items only
        [rarity_id : string] : {
            [item_id : string] : EquipmentCatalogData;
        };
    };
    fragment : { // fragments only
        [rarity_id : string] : {
            [item_id : string] : EquipmentCatalogData;
        };
    };
};

interface RegionOption {
    language : Language;
    text : string;
};

interface DropBuffOption {
    value : string;
    text : string;
};

interface QuestBuild2Results {
    required : Recipe,
    required_clean : Recipe,
    quest_scores: QuestScore[],
    priority_items : string[],
    priority_amount : Recipe,
    projects : Project[],
};

interface QuestSimulatorResults {
    stamina: number; // total number of stamina spent
    quests: { id: string; stamina: number; total_stamina: number; drops: Recipe }[]; // quests ran
    total_drops: Recipe; // all drops collected
    required: Recipe; // original collection of items required
};

export {
    Data, CharacterData, Character, EquipmentData, Equipment, QuestData, Quest,
    Fragment, EquipmentRecipeData, QuestItem, Recipe, Inventory, CharacterProject, ItemProject, BasicProject,
    Project, IgnoredRarities, Language, ProjectType, ProjectCheckStatus, QuestScore, Settings,
    QuestSettings, SavedCharacter, SavedCharacters, UserState, ProjectProgressResult, Projects, RankDetails,
    SessionProjects, EquipmentCatalogData, EquipmentCatalog, RegionOption, DropBuffOption,
    QuestBuild2Results, QuestSimulatorResults
};