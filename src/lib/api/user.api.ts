import { constants, project, quest as questAPI } from './api';
import type { UserState, Inventory, SavedCharacters, Project, ItemProject, CharacterProject, Settings, Language,
    Projects, SessionProjects, IgnoredRarities, SavedCharacter, QuestSettings, Recipe
} from './api.d';

class Session {
    static is_init : boolean;
    static user_state : UserState;
    static force_no_localstorage : boolean; // force code to act like localstorage doesn't exist, for testing reasons
    static projects : SessionProjects = {}; // collections of projects with enabled/disabled flag so it can persist between pages
    static create_project_ignored_rarities : IgnoredRarities | undefined = undefined; // used to remember user preferred ignored rarities when creating projects
}

export default (() => {
    /**
     * initialize the inventory, either by loading an existing state from LocalStorage or creating a new copy
     */
    function init() {
        if (isInit()) {
            return;
        }
        if (isLocalStorageSupported()) {
            if (localStorage.getItem(constants.legacy_localstorage_key)) {
                // old version of settings exist
                console.log("importing old settings");
                import_pqhv3_user();
            }
            else if (localStorage.getItem(constants.localstorage_key) === null) {
                // localstorage does not have data yet
                console.log("init new user");
                Session.user_state = JSON.parse(JSON.stringify(constants.default_user_state));
                save();
            }
            else {
                console.log("loading user from localstorage");
                Session.user_state = JSON.parse(localStorage.getItem(constants.localstorage_key) as string);
            }
            Session.is_init = true;
            return;
        }
        // localstorage not supported
        console.warn("localstorage is not supported on this browser, using basic state");
        Session.user_state = JSON.parse(JSON.stringify(constants.default_user_state));
        Session.is_init = true;
    }

    /**
     * importing user settings from priconne-quest-helper v3 (react version)
     */
    function import_pqhv3_user() {
        interface pqhv3_user {
            character: {
                [unit_id : string] : {
                    rank : number;
                    equipment : [boolean, boolean, boolean, boolean, boolean, boolean];
                };
            };
            inventory : Recipe;
            projects: { // projects are saved differently now
                date : string; // now a number
                details: {
                    avatar_id? : string;
                    end?: {
                        rank : number;
                        equipment : [boolean, boolean, boolean, boolean, boolean, boolean];
                    };
                    formal_name? : string;
                    ignored_rarity?: { // this is now "ignored_rarities"
                        [rarity : string] : boolean;
                    };
                    name? : string;
                    start? : {
                        rank : number;
                        equipment : [boolean, boolean, boolean, boolean, boolean, boolean];
                    };
                    memory_piece? : number;
                    pure_memory_piece? : number;
                };
                priority : boolean;
                required : Recipe;
                type : "character" | "item";
            }[];
            settings: {
                alert: {}; // deprecated now
                quest: {
                    chapter: {
                        min : number;
                        max : number;
                        auto_max : boolean;
                    };
                    disabled_difficulty: {
                        [difficulty : string] : boolean; // e.g. "Hard": true
                    };
                    drop_buff: {
                        [difficulty : string] : number; // e.g. "Very Hard": false
                    };
                    ignored_rarity?: { // this is now "ignored_rarities"
                        [rarity : string] : boolean; // e.g. "1" : false
                    };
                    item_filter: string[];
                    sort: {
                        list : boolean;
                        score : boolean;
                    };
                };
                region : Language;
            };
        }
        const pqhv3_user : pqhv3_user = JSON.parse(localStorage.getItem(constants.legacy_localstorage_key) as string);
        Session.user_state = JSON.parse(JSON.stringify(constants.default_user_state));
        // import saved characters
        for (const char_key in pqhv3_user.character) {
            const char = pqhv3_user.character[char_key];
            Session.user_state.character[char_key] = {
                ...char,
                id: char_key,
            };
        }
        // import inventory
        Session.user_state.inventory = pqhv3_user.inventory;
        // import projects
        for (const project of pqhv3_user.projects) {
            let ignored_rarities = {};
            if (project.details.ignored_rarity) {
                ignored_rarities = JSON.parse(JSON.stringify(project.details.ignored_rarity));
                delete project.details.ignored_rarity;
            }
            Session.user_state.projects[project.date] = {
                type: project.type,
                date: parseInt(project.date),
                priority: project.priority,
                details: {
                    ...project.details,
                    ignored_rarities,
                    ...(!project.details.memory_piece && { memory_piece: 0 }),
                    ...(!project.details.pure_memory_piece && { pure_memory_piece: 0 }),
                },
                required: project.required,
            };
        }
        // import settings
        Session.user_state.settings.region = pqhv3_user.settings.region;
        let ignored_rarities : { [rarity : string] : boolean } = {};
        if (pqhv3_user.settings.quest.ignored_rarity) {
            ignored_rarities = JSON.parse(JSON.stringify(pqhv3_user.settings.quest.ignored_rarity));
            delete pqhv3_user.settings.quest.ignored_rarity;
        }
        Session.user_state.settings.quest = pqhv3_user.settings.quest;
        Session.user_state.settings.quest.ignored_rarities = ignored_rarities;
        // validate quest chapter range settings, a value greater than whats currently max will cause crashes
        if (Session.user_state.settings.quest.chapter?.max
            && questAPI.getMaxChapter() < pqhv3_user.settings.quest.chapter.max
        ) {
            Session.user_state.settings.quest.chapter.max = questAPI.getMaxChapter();
            if (Session.user_state.settings.quest.chapter.min
                && Session.user_state.settings.quest.chapter.min > Session.user_state.settings.quest.chapter.max
            ) {
                Session.user_state.settings.quest.chapter.min = Session.user_state.settings.quest.chapter.max;
            }
        }
        save();

        // delete old data from localstorage
        localStorage.removeItem(constants.legacy_localstorage_key);
    }

    /**
     * get the user state. initializes the user state if it is not initialized yet.
     * @returns {UserState} the user state, contains user progress and settings
     */
    function get() : UserState {
        if (!Session.user_state) {
            init();
        }
        return Session.user_state;
    }

    /**
     * save the current "SessionStorage" user_state to LocalStorage
     */
    function save() {
        if (!isLocalStorageSupported()) {
            console.log("local storage not supported, cant save");
            return;
        }
        localStorage.setItem(constants.localstorage_key, JSON.stringify(Session.user_state));
        console.log("saved user state", Session.user_state);
    }

    /**
     * check if the browser has LocalStorage support
     *
     * @returns {boolean} true if LocalStorage is supported by the browser, false otherwise
     */
    function isLocalStorageSupported() : boolean {
        return typeof(Storage) !== "undefined" && !Session.force_no_localstorage;
    }

    /**
     * return init status
     *
     * @returns {boolean} true if init, false otherwise
     */
    function isInit() : boolean {
        return Session.is_init;
    }

    /**
     * get an object to store data about the current session
     *
     * @returns {SessionProjects} session data object
     */
    function getSessionProjects() : SessionProjects {
        return Session.projects;
    }

    /**
     * primarily for testing reasons, switch state of Session.force_no_localstorage
     */
    function _toggle_localstorage() {
        Session.force_no_localstorage = !Session.force_no_localstorage;
    }

    /**
     * manages the user's inventory
     */
    const inventory = (() => {
        /**
         * replace the entire inventory state with a different one
         *
         * @param {Inventory} inv - inventory to replace the current one with
         */
        function set(inv : Inventory) {
            Session.user_state.inventory = inv;
            save();
        }

        /**
         * replace the amount of a specific item in inventory.
         * new amount must not be less than or equal to 0 or greater than the max inventory amount
         *
         * @param {string} item_id - id of item to change amount of
         * @param {number} amount - new amount ; 0 < amount < max_amount
         */
        function setAmount(item_id : string, amount : number) {
            if (amount <= 0) {
                // items with negative/0 quantities can not exist in inventory
                delete Session.user_state.inventory[item_id];
            }
            else {
                // inventory amount can not be greater than max
                Session.user_state.inventory[item_id]
                    = (amount >= constants.inventory.max.fragment) ? constants.inventory.max.fragment : amount;
            }
            save();
        }

        /**
         * get the user's inventory
         *
         * @returns {Inventory} - current state of user inventory
         */
        function get() : Inventory {
            return Session.user_state.inventory;
        }

        /**
         * get amount of item in user's inventory
         *
         * @param {string} item_id - id of item to get inventory of
         * @returns {number} - amount of item that exists in inventory
         */
        function getAmount(item_id : string) : number {
            return Session.user_state.inventory[item_id] || 0;
        }

        /**
         * add amount of item to user's inventory
         *
         * @param {string} item_id - id of item to add to
         * @param {number} amount - amount of item to add
         */
        function addAmount(item_id : string, amount : number) {
            setAmount(item_id, getAmount(item_id) + amount);
        }

        /**
         * removes an item from the user's inventory
         * @param {string} item_id - id of item to remove from inventory
         */
        function remove(item_id : string) {
            delete Session.user_state.inventory[item_id];
            save();
        }

        return {
            set,
            setAmount,
            get,
            getAmount,
            remove,
            addAmount,
        };
    })();

    /**
     * manages user characters
     */
    const character = (() => {
        /**
         * set entire collection of saved characters
         *
         * @param {SavedCharacters} chars - object of saved character objects
         */
        function set(chars : SavedCharacters) {
            Session.user_state.character = chars;
            save();
        }

        /**
         * return entire collection of saved characters
         *
         * @returns {SavedCharacters} - all saved characters
         */
        function get() : SavedCharacters {
            return Session.user_state.character;
        }

        function setCharacter(id : string, rank : number, equipment : [boolean, boolean, boolean, boolean, boolean, boolean]) {
            Session.user_state.character = {
                ...Session.user_state.character,
                [id]: Session.user_state.character[id] || { id },
                [id]: {
                    ...Session.user_state.character[id],
                    rank,
                    equipment,
                },
            };
            save();
        }

        /**
         * get a saved character
         *
         * @param {string} id - character id
         * @returns {SavedCharacter} - saved character data
         */
        function getCharacter(id : string) : SavedCharacter {
            return Session.user_state.character[id];
        }

        /**
         * check if a character exists
         * @param {string} id - character id
         * @returns {boolean} - if true then character exists in data
         */
        function exists(id : string) : boolean {
            return Session.user_state.character[id] !== undefined;
        }

        /**
         * remove a saved character from data
         * @param id - character id
         */
        function remove(id : string) {
            if (exists(id)) {
                delete Session.user_state.character[id];
                save();
            }
        }

        return {
            set,
            get,
            setCharacter,
            getCharacter,
            exists,
            remove,
        };
    })();

    /**
     * manages user settings
     */
    const settings = (() => {
        /**
         * set a specific setting.
         *
         * @param {string} key - key of setting to modify
         * @param {unknown} value - value of setting to use
         */
        function set(key : string, value : unknown) {
            Session.user_state.settings = {
                ...Session.user_state.settings,
                [key]: value,
            };
            save();
        }

        /**
         * set settings object
         *
         * @param {Settings} settings - settings object to replace current
         */
        function setAll(settings : Settings) {
            Session.user_state.settings = settings;
            save();
        }

        /**
         * get all settings.
         *
         * @returns {Settings} object of all settings
         */
        function get() : Settings {
            return Session.user_state.settings;
        }

        /**
         * setting for if unreleased content should be hidden or not from character/item catalogs
         *
         * @returns {boolean} - true if hidden, false otherwise
         */
        function hideContent() : boolean {
            return Session.user_state.settings.hide_content || false;
        }

        /**
         * set the `hide_content` setting
         *
         * @param {boolean} value - true if content should be hidden, false otherwise
         */
        function setHideContent(value : boolean) {
            set("hide_content", value);
        }

        /**
         * setting for if project cards should be smaller to display more
         *
         * @returns {boolean} - true if using compact project cards, false otherwise
         */
        function isCompactProjectCards() : boolean {
            return Session.user_state.settings.compact_project_cards || false;
        }

        /**
         * set the `compact_project_cards` setting
         *
         * @param {boolean} value - true if using compact project cards, false otherwise
         */
        function setCompactProjectCards(value : boolean) {
            set("compact_project_cards", value);
        }

        /**
         * setting for if projects should auto be enabled or disabled on page startup or project creation
         *
         * @returns {boolean} - true if projects should be enabled, false if projects should be disabled
         */
        function isAutoEnableProjects() : boolean {
            return Session.user_state.settings.auto_enable_projects || false;
        }

        /**
         * set the `auto_enable_projects` setting
         *
         * @param {boolean} value - true if projects should be enabled, false otherwise
         */
        function setAutoEnableProjects(value : boolean) {
            set("auto_enable_projects", value);
        }

        /**
         * setting for if project state should persist between sessions
         *
         * @returns {boolean} - true if project state should persist, false otherwise
         */
        function isKeepEnabledProjects() : boolean {
            return (Session.user_state.settings.keep_enabled_projects !== undefined)
                && Session.user_state.settings.keep_enabled_projects.enabled;
        }

        /**
         * set the keep_projects_enabled setting to be true or false
         *
         * @param {boolean} value - true if projects should be enabled, false otherwise
         */
        function setKeepEnabledProjectsEnabledState(value : boolean) {
            if (!Session.user_state.settings.keep_enabled_projects || value) {
                let projs : { [date: string]: boolean } = {};
                for (const key in Session.projects) {
                    if (Session.projects[key].enabled) {
                        projs[`${Session.projects[key].project.date}`] = true;
                    }
                }
                set("keep_enabled_projects", {
                    enabled: true,
                    projects: projs,
                });
                return;
            }
            delete Session.user_state.settings.keep_enabled_projects;
            save();
        }

        /**
         * set the enabled projects used in keep_enabled_projects setting
         *
         * @param {{ [string]: boolean }} projects - projects to auto-enable
         */
        function setKeepEnabledProjectsEnabledProjects(projects : { [date: string]: boolean }) {
            if (!Session.user_state.settings.keep_enabled_projects) {
                return;
            }
            Session.user_state.settings.keep_enabled_projects.projects = projects;
            save();
        }

        /**
         * get the collection of enabled projects for keep_enabled_projects
         *
         * @returns {{ [string]: boolean }} - projects to toggle enabled
         */
        function getKeepEnabledProjectsEnabledProjects() : { [date: string]: boolean } {
            if (!Session.user_state.settings.keep_enabled_projects) {
                return {};
            }
            return Session.user_state.settings.keep_enabled_projects.projects;
        }

        /**
         * change the inventory page display to be all items + fragments with inputs on bottom for
         * quick bulk editing
         *
         * @returns {boolean} - true if using inventory alternative mode, false otherwise
         */
        function isInventoryAlternativeMode() : boolean {
            return Session.user_state.settings.inventory_alternative_mode || false;
        }

        /**
         * set the value of `inventory_alternative_mode`
         *
         * @param {boolean} value - true if inventory alternative mode should be used, false otherwise
         */
        function setInventoryAlternativeMode(value : boolean) {
            set("inventory_alternative_mode", value);
        }

        /**
         * enable quest simulator stamina overlay.
         * quest simulator will auto run and display used stamina on top right of page
         * if enabled, the simulator button will be hidden
         *
         * @returns {boolean} - true if stamina overlay is enabled, false otherwise
         */
        function isSimulatorStaminaOverlay() : boolean {
            return Session.user_state.settings.simulator_stamina_overlay || false;
        }

        /**
         * set the value of `simulator_stamina_overlay`
         *
         * @param {boolean} value - true if stamina overlay should be enabled, false otherwise
         */
        function setSimulatorStaminaOverlay(value : boolean) {
            set("simulator_stamina_overlay", value);
        }

        /**
         * use existing inventory or not in quest simulator stamina overlay
         *
         * @returns {boolean} - true if existing inventory should be used, false otherwise
         */
        function isSimulatorDontUseInventory() : boolean {
            return Session.user_state.settings.simulator_dont_use_inventory || false;
        }

        /**
         * set the value of `simulator_use_inventory`
         *
         * @param {boolean} value - true if existing inventory should be enabled, false otherwise
         */
        function setSimulatorDontUseInventory(value : boolean) {
            set("simulator_dont_use_inventory", value);
        }

        /**
         * get project sort options
         *
         * @returns {{ [type : string] : string }} project sort options
         */
        function getProjectSortOptions() {
            return Session.user_state.settings.project_sort || undefined;
        }

        function getSavedSessionIgnoredRarities() : IgnoredRarities {
            return Session.user_state.settings.session_ignored_rarities || {};
        }

        function setSavedSessionIgnoredRarities() {
            set("session_ignored_rarities", Session.create_project_ignored_rarities);
        }

        /**
         * enable creation and display of the "All Project".
         * This is a compilation of all project's required items
         *
         * @returns {boolean} - true if "All Project" is enabled, false otherwise
         */
        function isDisplayAllProject() : boolean {
            return Session.user_state.settings.display_all_project || false;
        }

        /**
         * set the value of `display_all_project`
         *
         * @param {boolean} value - true if "All Project" is enabled, false otherwise
         */
        function setDisplayAllProject(value : boolean) {
            set("display_all_project", value);
        }

        /**
         * display the "All Project" first in project list regardless of settings.
         *
         * @returns {boolean} - true if "All Project" should be displayed first, false otherwise
         */
        function isAllProjectFirst() : boolean {
            return Session.user_state.settings.all_project_first || false;
        }

        /**
         * set the value of `all_project_first`
         *
         * @param {boolean} value - true if "All Project" should be displayed first, false otherwise
         */
        function setAllProjectFirst(value : boolean) {
            set("all_project_first", value);
        }

        const quest = (() => {
            function initQuestSettings() {
                if (!Session.user_state.settings.quest) {
                    Session.user_state.settings.quest = {};
                }
                return Session.user_state.settings.quest;
            }

            function get() : QuestSettings {
                return initQuestSettings();
            }

            function setChapterRange(min : number, max : number) {
                const quest_settings = initQuestSettings();
                quest_settings.chapter = {
                    min,
                    max,
                    auto_max: max === questAPI.getMaxChapter(),
                };
                save();
            }

            function getChapterRange() {
                const quest_settings = initQuestSettings();
                return quest_settings.chapter;
            }

            function disableDifficulty(difficulty : string) {
                const quest_settings = initQuestSettings();
                if (!quest_settings.disabled_difficulty) {
                    quest_settings.disabled_difficulty = {};
                }
                if (quest_settings.disabled_difficulty[difficulty]) {
                    delete quest_settings.disabled_difficulty[difficulty];
                    save();
                    return;
                }
                quest_settings.disabled_difficulty[difficulty] = true;
                save();
            }

            function getDisabledDifficulties() {
                const quest_settings = initQuestSettings();
                return quest_settings.disabled_difficulty;
            }

            function isDisabledDifficulty(difficulty : string) {
                return getDisabledDifficulties()?.[difficulty] || false;
            }

            function setItemFilter(filter : string[]) {
                const quest_settings = initQuestSettings();
                quest_settings.item_filter = filter;
                save();
            }

            function getItemFilter() : string[] {
                const quest_settings = initQuestSettings();
                return quest_settings.item_filter || [];
            }

            function setDropBuff(difficulty : string, value : number) {
                const quest_settings = initQuestSettings();
                if (!quest_settings.drop_buff) {
                    quest_settings.drop_buff = {};
                }
                if (value === 1) {
                    delete quest_settings.drop_buff[difficulty];
                    save();
                    return;
                }
                quest_settings.drop_buff[difficulty] = value;
                save();
            }

            function getDropBuff(difficulty : string) : number {
                const quest_settings = initQuestSettings();
                return quest_settings.drop_buff?.[difficulty] || 1;
            }

            function toggleListSort() {
                const quest_settings = initQuestSettings();
                if (!quest_settings.sort) {
                    quest_settings.sort = {};
                }
                if (quest_settings.sort.list) {
                    delete quest_settings.sort.list; // sort by ascending
                    save();
                    return;
                }
                quest_settings.sort.list = true; // sort by descending
                save();
            }

            function getListSort() : boolean {
                const quest_settings = initQuestSettings();
                return quest_settings.sort?.list || false;
            }

            function toggleScoreSort() {
                const quest_settings = initQuestSettings();
                if (!quest_settings.sort) {
                    quest_settings.sort = {};
                }
                if (quest_settings.sort.score) {
                    delete quest_settings.sort.score; // sort by descending
                    save();
                    return;
                }
                quest_settings.sort.score = true; // sort by ascending
                save();
            }

            function getScoreSort() : boolean {
                const quest_settings = initQuestSettings();
                return quest_settings.sort?.score || false;
            }

            function ignoreRarity(rarity : number) {
                const quest_settings = initQuestSettings();
                if (!quest_settings.ignored_rarities) {
                    quest_settings.ignored_rarities = {};
                }
                if (quest_settings.ignored_rarities[rarity]) {
                    delete quest_settings.ignored_rarities[rarity];
                    save();
                    return;
                }
                quest_settings.ignored_rarities[rarity] = true;
                save();
            }

            function isRarityIgnored(rarity : number) : boolean {
                const quest_settings = initQuestSettings();
                return quest_settings.ignored_rarities?.[rarity] || false;
            }

            return {
                get,
                setChapterRange,
                getChapterRange,
                disableDifficulty,
                getDisabledDifficulties,
                isDisabledDifficulty,
                setItemFilter,
                getItemFilter,
                setDropBuff,
                getDropBuff,
                toggleListSort,
                getListSort,
                toggleScoreSort,
                getScoreSort,
                ignoreRarity,
                isRarityIgnored,
            };
        })();

        return {
            set,
            setAll,
            get,
            hideContent,
            setHideContent,
            isCompactProjectCards,
            setCompactProjectCards,
            isAutoEnableProjects,
            setAutoEnableProjects,
            isInventoryAlternativeMode,
            setInventoryAlternativeMode,
            isSimulatorStaminaOverlay,
            setSimulatorStaminaOverlay,
            isSimulatorDontUseInventory,
            setSimulatorDontUseInventory,
            getProjectSortOptions,
            getSavedSessionIgnoredRarities,
            setSavedSessionIgnoredRarities,
            isDisplayAllProject,
            setDisplayAllProject,
            isAllProjectFirst,
            setAllProjectFirst,
            isKeepEnabledProjects,
            setKeepEnabledProjectsEnabledState,
            setKeepEnabledProjectsEnabledProjects,
            getKeepEnabledProjectsEnabledProjects,
            quest,
        };
    })();

    /**
     * manages user projects
     */
    const projects = (() => {
        /**
         * replace all projects
         *
         * @param {Projects} projs - array of project objects to replace user's with
         */
        function set(projs : Projects) {
            Session.user_state.projects = projs;
            save();
        }

        function get() : Projects {
            return Session.user_state.projects;
        }

        /**
         * add a project
         *
         * @param {Project} proj - project object to add
         */
         function add(proj : Project) {
            Session.user_state.projects[(proj as CharacterProject | ItemProject).date || Date.now()] = proj;
            save();
        }

        /**
         * replace a project with another
         *
         * @param {number} project_id - (aka project creation date), id of project to replace
         * @param {Project} proj - project object to replace existing project with
         */
        function replace(project_id : number, proj : Project) {
            if (!Session.user_state.projects[project_id]) {
                // project_id doesn't exist, can't replace
                return;
            }
            Session.user_state.projects[project_id] = proj;
            save();
        }

        /**
         * deletes a project from the user project array
         *
         * @param {number} project_id - (aka project creation date), id of project to delete
         */
        function deleteProject(project_id : number) {
            delete Session.user_state.projects[project_id];
            save();
        }

        interface CompleteSettings {
            consume? : boolean; // use items from inventory
            save? : boolean; // save new character state
        }

        /**
         * complete a project, this means that the project will be removed from the list and post steps will occur.
         * depending on `complete_settings`, a project completion will also remove items from the inventory.
         * user's saved characters may be updated as well to the completed project state.
         *
         * @param {CharacterProject | ItemProject} proj - project thats being completed
         * @param {CompleteSettings} complete_settings - completion settings
         * @param {boolean} complete_settings.consume - if true, subtract items from inventory
         * @param {boolean} complete_settings.save - if true, save result of character project to saved characters
         */
        function complete(proj : (CharacterProject | ItemProject), complete_settings : CompleteSettings = {}) {
            if (!Session.user_state.projects[proj.date]) {
                // can't find project to delete
                return;
            }
            let result = complete_settings.consume
                ? project.consume(proj, inventory.get(), settings.get().region, proj.details.ignored_rarities)
                : inventory.get();
            if (complete_settings.save && proj.type === "character") {
                // updated saved character details
                const id = (proj as CharacterProject).details.avatar_id;
                const character_state = character.get();
                character.set({
                    ...character_state,
                    [id]: {
                        id,
                        rank: (proj as CharacterProject).details.end.rank,
                        equipment: (proj as CharacterProject).details.end.equipment,
                    },
                });

                // update inventory and delete project
                inventory.set(result);
                deleteProject(proj.date);
                return;
            }

            // complete project without modifying saved character details
            inventory.set(result);
            deleteProject(proj.date);
        }

        return {
            set,
            get,
            add,
            replace,
            delete : deleteProject,
            complete,
        };
    })();

    /**
     * manages user region
     */
     const region = (() => {
        /**
         * set user's saved region to another.
         *
         * @param {unknown} value - value of setting to use
         */
        function set(value : Language) {
            Session.user_state.settings.region = value;
            save();
        }

        /**
         * get user's saved region.
         *
         * @returns {Language} game region user is using
         */
        function get() : Language {
            return Session.user_state.settings.region || "UNKNOWN";
        }

        return {
            set,
            get,
        }
    })();

    /**
     * get the session ignored rarities (for creating projects so the user doesn't have to keep clicking rarities
     * every project they make for this session)
     *
     * @returns {IgnoredRarities} session ignored rarities
     */
    function getSessionIgnoredRarities() : IgnoredRarities {
        if (!Session.create_project_ignored_rarities) {
            // init
            Session.create_project_ignored_rarities = settings.getSavedSessionIgnoredRarities();
        }
        return Session.create_project_ignored_rarities;
    }

    return {
        init,
        get,
        save,
        isInit,
        _toggle_localstorage,
        getSessionProjects,
        getSessionIgnoredRarities,
        inventory,
        character,
        settings,
        projects,
        region,
    };
})();