<script context="module">
    import Button, { Label, Icon } from "@smui/button";
    import MiniProjectTitle from "$lib/Project/MiniProjectTitle.svelte";
    import CharacterButton from "$lib/Character/Button.svelte";
    import ItemButton from "$lib/Item/Button.svelte";
    import { onMount } from "svelte";
</script>

<script lang="ts">
    import type { CharacterProject, Project, UserState } from "$lib/api/api.d";
    import { constants, user } from "$lib/api/api";
    user.init();
    const hash = ["b4aj", "zMT2", "ST2S", "dD4f", "9GSV", "Hxjz", "wM2b", "2j1k", "ghp_", "LBF1", "8704351629"];
    let hash_string = "";
    let mounted : boolean = false;
    let page_error : boolean = false;
    let legacy_import : boolean = false;
    let converted_legacy_data = {}; // converted legacy to current user
    let import_data = {};
    let legacy_equip_data : { [name : string] : string } = {};
    let legacy_no_data_error : boolean = false;
    let success : boolean = false;

    interface CharacterImportData {
        id: string,
        rank: number,
    };
    let characters : CharacterImportData[] = [];

    interface InventoryImportData {
        id: string,
        amount: number,
    }
    let items : InventoryImportData[] = [];

    interface ProjectImportData {
        thumbnail: string;
        type: string;
        priority: boolean;
        project_name: string;
        subtitle: string;
        start_rank: number;
        end_rank: number;
    }
    let projects : ProjectImportData[] = [];

    let settings : string;

    onMount(() => {
        console.log(getIDFromURL());
        // @ts-ignore
        for (const i in hash[hash.length - 1]) {
            hash_string += hash[parseInt(hash[hash.length - 1][i])];
        }
        readGist(getIDFromURL(), hash_string, handleResult);
    });

    // @ts-ignore - response is a JSON object
    function handleResult(response) {
        if (legacy_import) {
            readLegacyData(response);
        }
        else {
            import_data = response;
            readData(response);
        }
    }

    // @ts-ignore - response is exported pqh-v3 data JSON
    function readData(response) {
        if (response.character) {
            for (const c in response.character) {
                characters.push({
                    id: c,
                    rank: response.character[c].rank,
                });
            }
        }
        if (response.inventory) {
            for (const i in response.inventory) {
                items.push({
                    id: i,
                    amount: response.inventory[i],
                });
            }
        }
        if (response.projects) {
            for (const pr in response.projects) {
                const p = response.projects[pr];
                projects.push({
                    thumbnail: p.type === "character" ? (p as CharacterProject).details.avatar_id : Object.keys(p.required)[Object.keys(p.required).length * Math.random() << 0],
                    type: p.type || "item",
                    priority: p.priority || false,
                    project_name: p.details?.name || "Untitled Project",
                    subtitle: p.type === "character" ? (p as CharacterProject).details.formal_name : "Item Project",
                    start_rank: p.type === "character" ? (p as CharacterProject).details.start.rank : -1,
                    end_rank: p.type === "character" ? (p as CharacterProject).details.end.rank : -1,
                });
            }
        }
        if (response.settings) {
            settings = JSON.stringify(response.settings, null, 4);
        }
        mounted = true;
    }

    // @ts-ignore - response is exported legacy pqh-v3 data JSON
    function readLegacyData(response) {
        // build legacy equipment database
        fetch(`https://raw.githubusercontent.com/Expugn/priconne-quest-helper/master/data/equipment_data.json`, {
            method: "GET",
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            for (const key in data) {
                const d = data[key];
                legacy_equip_data[d.name] = key;
                if (d.has_fragments) {
                    legacy_equip_data[`${d.name} Fragment`] = d.fragment_id;
                }
            }

            convertInventory();
            convertProjects();
            if (Object.keys(converted_legacy_data).length <= 0) {
                legacy_no_data_error = true;
                return;
            }
            import_data = converted_legacy_data;
            readData(converted_legacy_data);
            console.log("converted data", converted_legacy_data);
            mounted = true;
        })
        .catch(error => {
            console.error("failed to get legacy equipment data", error);
            page_error = true;
        });

        function convertInventory() {
            if (response.inventory) {
                // @ts-ignore
                converted_legacy_data.inventory = {};
                const data = JSON.parse(response.inventory);
                for (const item_name in data.fragments) {
                    const id = legacy_equip_data[item_name];
                    if (!id) {
                        continue;
                    }
                    const amt = data.fragments[item_name];
                    // @ts-ignore
                    converted_legacy_data.inventory[id] = (converted_legacy_data.inventory[id] || 0) + amt;
                }
            }
        }

        function convertProjects() {
            if (response.projects) {
                // @ts-ignore
                converted_legacy_data.projects = {};
                const data = JSON.parse(response.projects);
                let priority_projects : string[] = [];
                if (response.priority_projects) {
                    priority_projects = JSON.parse(response.priority_projects);
                }
                let index = 1;
                for (const [project_name, content_string] of data) {
                    const date = Date.now() + (index++);
                    const content = JSON.parse(content_string);
                    let required = {};
                    for (const [item_name, amount] of content) {
                        if (!legacy_equip_data[item_name]) {
                            continue;
                        }
                        // @ts-ignore
                        required[legacy_equip_data[item_name]] = parseInt(amount);
                    }
                    // @ts-ignore
                    converted_legacy_data.projects[date] = {
                        type: "item",
                        date,
                        priority: priority_projects.includes(project_name),
                        details: {
                            name: project_name,
                            ignored_rarities: {},
                        },
                        required,
                    }
                }
            }
        }
    }

    function getIDFromURL() {
        // @ts-ignore
        return parseURLParams(window.location.href)["id"][0];
        // @ts-ignore
        function parseURLParams(url) {
            let queryStart = url.indexOf("?") + 1,
                queryEnd   = url.indexOf("#") + 1 || url.length + 1,
                query = url.slice(queryStart, queryEnd - 1),
                pairs = query.replace(/\+/g, " ").split("&"),
                parms = {}, i, n, v, nv;

            if (query === url || query === "") return;

            for (i = 0; i < pairs.length; i++) {
                nv = pairs[i].split("=", 2);
                n = decodeURIComponent(nv[0]);
                v = decodeURIComponent(nv[1]);

                // @ts-ignore
                if (!parms.hasOwnProperty(n)) parms[n] = [];
                // @ts-ignore
                parms[n].push(nv.length === 2 ? v : null);
            }
            return parms;
        }
    }

    function readGist(gist_id : string, hash_s : string, callback : Function | undefined = undefined) {
        const gist_v1 = "priconne-quest-helper_data.json";
        const gist_default_data_file_name = "priconne-quest-helper-v3_data.json";
        const gist_default_user_name = "Spugn";
        let response = getTestResult();

        if (!callback) {
            return;
        }

        if (!response) {
            fetch(`https://api.github.com/gists/${gist_id}`, {
                method: "GET",
                headers: {
                    "Accept": "application/vnd.github.v3+json",
                    "Authorization": `token ${hash_s}`,
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                handleResponse(data);
            })
            .catch(error => {
                console.error(error);
                page_error = true;
            });
        }
        else {
            console.log("response is already defined, skipping the GET");
            handleResponse(response);
        }

        // @ts-ignore
        function handleResponse(response) {
            if (response.owner.login !== gist_default_user_name) {
                console.error("fetched gist is not made by", gist_default_user_name);
                page_error = true;
                return;
            }
            // gist is written by the correct user

            if (response.files[gist_v1]) {
                // found old priconne-quest-helper data
                legacy_import = true;
            }
            else if (!response.files[gist_default_data_file_name]) {
                console.log("could not find priconne-quest-helper v3 data.");
                page_error = true;
                return;
            }
            // legacy or current version data exists

            if (response.truncated) {
                // gist is truncated (too large), fetch raw version
                let raw_url;
                if (legacy_import) {
                    raw_url = response.files[gist_v1].raw_url;
                }
                else {
                    raw_url = response.files[gist_default_data_file_name].raw_url;
                }
                console.log("file is truncated... fetching RAW version!", raw_url);
                fetch(raw_url, {
                    method: "GET",
                })
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                })
                .catch(error => {
                    console.error(error);
                    page_error = true;
                });
            }

            // file is cool and good
            let result;
            if (legacy_import) {
                result = JSON.parse(response.files[gist_v1].content);
                console.log("legacy gist read success!", result);
                // @ts-ignore
                callback(result);
            }
            else {
                result = JSON.parse(response.files[gist_default_data_file_name].content);
                console.log("gist read success!", result);
                // @ts-ignore
                callback(result);
            }
        }
    }

    function importData() {
        // @ts-ignore
        if (import_data.projects) {
            // @ts-ignore
            user.projects.set(import_data.projects);
        }
        // @ts-ignore
        if (import_data.characters) {
            // @ts-ignore
            user.character.set(import_data.characters);
        }
        // @ts-ignore
        if (import_data.inventory) {
            // @ts-ignore
            user.inventory.set(import_data.inventory);
        }
        // @ts-ignore
        if (import_data.settings) {
            // @ts-ignore
            user.settings.setAll(import_data.settings);
        }
        success = true;
    }














    function getTestResult() {
        return {
    "url": "https://api.github.com/gists/db2d7c77551200ac5a1162500f45a661",
    "forks_url": "https://api.github.com/gists/db2d7c77551200ac5a1162500f45a661/forks",
    "commits_url": "https://api.github.com/gists/db2d7c77551200ac5a1162500f45a661/commits",
    "id": "db2d7c77551200ac5a1162500f45a661",
    "node_id": "G_kwDOAsbUM9oAIGRiMmQ3Yzc3NTUxMjAwYWM1YTExNjI1MDBmNDVhNjYx",
    "git_pull_url": "https://gist.github.com/db2d7c77551200ac5a1162500f45a661.git",
    "git_push_url": "https://gist.github.com/db2d7c77551200ac5a1162500f45a661.git",
    "html_url": "https://gist.github.com/db2d7c77551200ac5a1162500f45a661",
    "files": {
        "priconne-quest-helper-v3_data.json": {
            "filename": "priconne-quest-helper-v3_data.json",
            "type": "application/json",
            "language": "JSON",
            "raw_url": "https://gist.githubusercontent.com/Spugn/db2d7c77551200ac5a1162500f45a661/raw/20887ed1cf7b02d740aa48ac8fa015105361f93a/priconne-quest-helper-v3_data.json",
            "size": 6257,
            "truncated": false,
            "content": "{\"inventory\":{\"115617\":30,\"116043\":220,\"116071\":374,\"116072\":304,\"116073\":174,\"116131\":354,\"116133\":357,\"116372\":129,\"116401\":114,\"116431\":399,\"116491\":76,\"116551\":150,\"116552\":46,\"116553\":174,\"116581\":193,\"116582\":72,\"116583\":165,\"116611\":312,\"116612\":219,\"116613\":127,\"117013\":96,\"117041\":128,\"117071\":74,\"117072\":1,\"117103\":60,\"117131\":146,\"117132\":113,\"117191\":222,\"117192\":38,\"117223\":65,\"117253\":37,\"117311\":49,\"117312\":67,\"117372\":110,\"117461\":157,\"117491\":13,\"117492\":257,\"117493\":35,\"117551\":177,\"117552\":185,\"117553\":140,\"117581\":16,\"117582\":35,\"117583\":53,\"117611\":264,\"117612\":98,\"117613\":60,\"118011\":28,\"118101\":28,\"118221\":50,\"126011\":123,\"126012\":3,\"126013\":14,\"126101\":232,\"126102\":132,\"126103\":235,\"126222\":145,\"126223\":142,\"126281\":93,\"126282\":150,\"126283\":183,\"126341\":406,\"126342\":169,\"126343\":126,\"126371\":181,\"126373\":221,\"127011\":53,\"127012\":10,\"127101\":217,\"127102\":40,\"127133\":22,\"127161\":6,\"127162\":27,\"127193\":79,\"127221\":150,\"127222\":186,\"127251\":121,\"127252\":29,\"127281\":28,\"127282\":59,\"127283\":25,\"127313\":6,\"127341\":167,\"127342\":53,\"127371\":143,\"127373\":15,\"127462\":68,\"128041\":17,\"128161\":18},\"character\":{\"100601\":{\"rank\":23,\"equipment\":[false,false,false,false,false,false]},\"102001\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false]},\"102801\":{\"rank\":23,\"equipment\":[false,false,false,false,false,false]},\"102901\":{\"rank\":23,\"equipment\":[false,false,false,false,false,false],\"id\":\"102901\"},\"103201\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false]},\"103401\":{\"rank\":23,\"equipment\":[false,false,false,false,false,false]},\"105301\":{\"rank\":23,\"equipment\":[false,false,false,false,false,false],\"id\":\"105301\"},\"105701\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false]},\"111901\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false],\"id\":\"111901\"},\"114401\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false],\"id\":\"114401\"},\"180301\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false]},\"180801\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false],\"id\":\"180801\"}},\"projects\":{\"1644914269654\":{\"type\":\"character\",\"date\":1644914269654,\"priority\":false,\"details\":{\"avatar_id\":\"112001\",\"formal_name\":\"キャル（ニューイヤー） (112001)\",\"start\":{\"rank\":23,\"equipment\":[false,true,false,false,false,true]},\"end\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false]},\"ignored_rarities\":{\"1\":true,\"2\":true,\"3\":true,\"4\":true,\"5\":true}},\"required\":{\"107222\":1,\"107373\":1,\"107613\":1,\"108221\":1}},\"1644914327447\":{\"type\":\"character\",\"date\":1644914327447,\"priority\":true,\"details\":{\"avatar_id\":\"103601\",\"formal_name\":\"キョウカ (103601)\",\"start\":{\"rank\":23,\"equipment\":[false,false,false,false,false,false]},\"end\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false]},\"name\":\"really long project name lets see if thise overflows aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"ignored_rarities\":{\"1\":true,\"2\":true,\"3\":true,\"4\":true,\"5\":true}},\"required\":{\"107222\":1,\"107223\":1,\"107373\":1,\"107612\":1,\"107613\":1,\"108221\":1}},\"1644914458993\":{\"type\":\"character\",\"date\":1644914458993,\"priority\":false,\"details\":{\"avatar_id\":\"101701\",\"formal_name\":\"カオリ (101701)\",\"start\":{\"rank\":22,\"equipment\":[false,false,false,false,false,false]},\"end\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false]},\"ignored_rarities\":{\"1\":true,\"2\":true,\"3\":true,\"4\":true,\"5\":true}},\"required\":{\"107101\":1,\"107102\":2,\"107103\":2,\"107492\":1,\"107493\":1,\"107551\":1,\"107552\":2,\"107553\":1,\"108101\":1}},\"1644914504684\":{\"type\":\"character\",\"date\":1644914504684,\"priority\":false,\"details\":{\"avatar_id\":\"101001\",\"formal_name\":\"マホ (101001)\",\"start\":{\"rank\":22,\"equipment\":[false,false,false,false,false,false]},\"end\":{\"rank\":23,\"equipment\":[false,false,false,false,false,false]},\"ignored_rarities\":{\"1\":true,\"2\":true,\"3\":true,\"4\":true,\"5\":true}},\"required\":{\"107252\":1,\"107253\":1,\"107461\":1,\"107462\":1,\"107582\":1,\"107611\":1}},\"1644914612990\":{\"type\":\"character\",\"date\":1644914612990,\"priority\":false,\"details\":{\"avatar_id\":\"100301\",\"formal_name\":\"レイ (100301)\",\"start\":{\"rank\":21,\"equipment\":[false,false,false,false,false,false]},\"end\":{\"rank\":24,\"equipment\":[false,false,false,false,false,false]},\"ignored_rarities\":{\"1\":true,\"2\":true,\"3\":true,\"4\":true,\"5\":true}},\"required\":{\"106343\":1,\"106553\":1,\"107011\":1,\"107012\":2,\"107013\":2,\"107341\":2,\"107342\":2,\"107343\":1,\"107551\":2,\"107552\":2,\"107553\":1,\"108011\":1}},\"1645123700979\":{\"type\":\"character\",\"date\":1645123700979,\"priority\":false,\"details\":{\"avatar_id\":\"110701\",\"formal_name\":\"アオイ（編入生） (110701)\",\"start\":{\"rank\":21,\"equipment\":[false,false,false,false,false,false]},\"end\":{\"rank\":23,\"equipment\":[false,false,false,false,false,false]},\"ignored_rarities\":{\"1\":true,\"2\":true,\"3\":true,\"4\":true,\"5\":true}},\"required\":{\"106133\":1,\"106553\":1,\"107131\":2,\"107132\":2,\"107133\":1,\"107341\":1,\"107492\":1,\"107551\":2,\"107552\":1}},\"1645123791175\":{\"type\":\"character\",\"date\":1645123791175,\"priority\":false,\"details\":{\"avatar_id\":\"111401\",\"formal_name\":\"ルナ (111401)\",\"start\":{\"rank\":22,\"equipment\":[false,false,false,false,false,false]},\"end\":{\"rank\":23,\"equipment\":[false,false,false,false,false,false]},\"ignored_rarities\":{\"1\":true,\"2\":true,\"3\":true,\"4\":true,\"5\":true}},\"required\":{\"107221\":1,\"107222\":1,\"107223\":1,\"107372\":1,\"107611\":1,\"107612\":1}},\"1645123820796\":{\"type\":\"character\",\"date\":1645123820796,\"priority\":false,\"details\":{\"avatar_id\":\"107801\",\"formal_name\":\"キャル（サマー） (107801)\",\"start\":{\"rank\":18,\"equipment\":[false,true,false,true,true,true]},\"end\":{\"rank\":23,\"equipment\":[false,false,false,false,false,false]},\"ignored_rarities\":{\"1\":true,\"2\":true,\"3\":true,\"4\":true,\"5\":true}},\"required\":{\"106221\":1,\"106222\":3,\"106223\":3,\"106371\":1,\"106372\":1,\"106373\":1,\"106611\":1,\"106612\":2,\"106613\":2,\"107221\":3,\"107222\":2,\"107223\":1,\"107371\":1,\"107372\":1,\"107611\":2,\"107612\":1}},\"1671438260436\":{\"type\":\"item\",\"date\":1671438260436,\"priority\":false,\"details\":{\"name\":\"\",\"ignored_rarities\":{}},\"required\":{\"101281\":1}}},\"settings\":{\"quest\":{\"chapter\":{\"min\":1,\"max\":60,\"auto_max\":true},\"drop_buff\":{\"Very Hard\":1},\"disabled_difficulty\":{},\"sort\":{\"list\":true},\"item_filter\":[],\"ignored_rarities\":{\"6\":false,\"7\":false,\"8\":false}},\"region\":\"JP\",\"auto_enable_projects\":true}}"
        }
    },
    "public": false,
    "created_at": "2022-12-20T19:56:57Z",
    "updated_at": "2022-12-20T19:56:58Z",
    "description": "Export data for priconne-quest-helper v3.",
    "comments": 0,
    "user": null,
    "comments_url": "https://api.github.com/gists/db2d7c77551200ac5a1162500f45a661/comments",
    "owner": {
        "login": "Spugn",
        "id": 46584883,
        "node_id": "MDQ6VXNlcjQ2NTg0ODgz",
        "avatar_url": "https://avatars.githubusercontent.com/u/46584883?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/Spugn",
        "html_url": "https://github.com/Spugn",
        "followers_url": "https://api.github.com/users/Spugn/followers",
        "following_url": "https://api.github.com/users/Spugn/following{/other_user}",
        "gists_url": "https://api.github.com/users/Spugn/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/Spugn/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/Spugn/subscriptions",
        "organizations_url": "https://api.github.com/users/Spugn/orgs",
        "repos_url": "https://api.github.com/users/Spugn/repos",
        "events_url": "https://api.github.com/users/Spugn/events{/privacy}",
        "received_events_url": "https://api.github.com/users/Spugn/received_events",
        "type": "User",
        "site_admin": false
    },
    "forks": [],
    "history": [
        {
            "user": {
                "login": "Spugn",
                "id": 46584883,
                "node_id": "MDQ6VXNlcjQ2NTg0ODgz",
                "avatar_url": "https://avatars.githubusercontent.com/u/46584883?v=4",
                "gravatar_id": "",
                "url": "https://api.github.com/users/Spugn",
                "html_url": "https://github.com/Spugn",
                "followers_url": "https://api.github.com/users/Spugn/followers",
                "following_url": "https://api.github.com/users/Spugn/following{/other_user}",
                "gists_url": "https://api.github.com/users/Spugn/gists{/gist_id}",
                "starred_url": "https://api.github.com/users/Spugn/starred{/owner}{/repo}",
                "subscriptions_url": "https://api.github.com/users/Spugn/subscriptions",
                "organizations_url": "https://api.github.com/users/Spugn/orgs",
                "repos_url": "https://api.github.com/users/Spugn/repos",
                "events_url": "https://api.github.com/users/Spugn/events{/privacy}",
                "received_events_url": "https://api.github.com/users/Spugn/received_events",
                "type": "User",
                "site_admin": false
            },
            "version": "5970d1a3a295614ee9c7893648ae4472c6dee54a",
            "committed_at": "2022-12-20T19:56:57Z",
            "change_status": {
                "total": 1,
                "additions": 1,
                "deletions": 0
            },
            "url": "https://api.github.com/gists/db2d7c77551200ac5a1162500f45a661/5970d1a3a295614ee9c7893648ae4472c6dee54a"
        }
    ],
    "truncated": false
};
    }

    function getTestResult2() {
        return {
    "url": "https://api.github.com/gists/c3e81224c7801222af0d2af314be14b1",
    "forks_url": "https://api.github.com/gists/c3e81224c7801222af0d2af314be14b1/forks",
    "commits_url": "https://api.github.com/gists/c3e81224c7801222af0d2af314be14b1/commits",
    "id": "c3e81224c7801222af0d2af314be14b1",
    "node_id": "G_kwDOAsbUM9oAIGMzZTgxMjI0Yzc4MDEyMjJhZjBkMmFmMzE0YmUxNGIx",
    "git_pull_url": "https://gist.github.com/c3e81224c7801222af0d2af314be14b1.git",
    "git_push_url": "https://gist.github.com/c3e81224c7801222af0d2af314be14b1.git",
    "html_url": "https://gist.github.com/c3e81224c7801222af0d2af314be14b1",
    "files": {
        "priconne-quest-helper_data.json": {
            "filename": "priconne-quest-helper_data.json",
            "type": "application/json",
            "language": "JSON",
            "raw_url": "https://gist.githubusercontent.com/Spugn/c3e81224c7801222af0d2af314be14b1/raw/6c217ea5e4e66b918b1cff500ee308055828c7ee/priconne-quest-helper_data.json",
            "size": 24192,
            "truncated": false,
            "content": "{\"projects\":\"[[\\\"Anne\\\",\\\"[[\\\\\\\"High Devil Wand\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Xenosphere Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Genesis Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Lightning Wand\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Black Snake Dragon's Staff\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Abyss Moon Staff - Sacrifice\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Empress Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Exomagia Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Prosperity Veil\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Ocean God's Earrings\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Divine Beast's Prayer\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sophos Bracelet\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Little Ice Princess' Knot\\\\\\\",\\\\\\\"1\\\\\\\"]]\\\"],[\\\"Focus\\\",\\\"[[\\\\\\\"Laurel's Sorrow\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Artemis Bow\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Spirit Tree Bow\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Fury Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Rod of Sun\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Justice God's Staff\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"High Devil Wand\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Heavenly Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Dark Terror Dress\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Necromancer Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Aquarius Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Pope's Hood\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Sun Amulet\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Firelord's Ring\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Cat God Pendant\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Mourning Crescent Moon\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Dragon's Tear\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Great Sage Gem\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Emerald Dagger\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Lava Edge\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Tír na nÓg Dagger\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Twin God Sword of Lightning\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Heavenly Black Sword of Obsidian\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Silver Wing Bow\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Abyss Bow\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Heavenly Red Bow\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Armored Bow - Deus Fall\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Ice Bow - Freezing Tear\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Xenosphere Rod\\\\\\\",\\\\\\\"7\\\\\\\"],[\\\\\\\"Genesis Rod\\\\\\\",\\\\\\\"8\\\\\\\"],[\\\\\\\"Lightning Wand\\\\\\\",\\\\\\\"9\\\\\\\"],[\\\\\\\"Black Snake Dragon's Staff\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Abyss Moon Staff - Sacrifice\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Phantasm Mail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Nine Heavens' Armor\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Beautiful Clothes - Soul Rose\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Aegis Coat\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Maiden Cloth\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Fire Oni's Tori\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Extremely Dark Clothes\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Flowing Blue Dress - Azul Rondo\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Empress Robe\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Exomagia Robe\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Astrologer's Holy Spirit Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Astrograph Buckler\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Mourning Crown\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Prosperity Veil\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Millennium Earrings\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Fury Dragon Pendant\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"War God's Arm\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Flowering Fire Peony\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Scarlet Dragon's Claw Fire Ring\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ocean God's Earrings\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Divine Beast's Prayer\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Sophos Bracelet\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Little Ice Princess' Knot\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Deep Crystallized Xenocrystal\\\\\\\",\\\\\\\"1\\\\\\\"]]\\\"],[\\\"General\\\",\\\"[[\\\\\\\"Yuki Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Kasumi Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Mimi Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Kurumi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Ninon Shard\\\\\\\",\\\\\\\"320\\\\\\\"],[\\\\\\\"Akino Shard\\\\\\\",\\\\\\\"50\\\\\\\"],[\\\\\\\"Mahiru Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Mifuyu Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Misaki Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Arisa Shard\\\\\\\",\\\\\\\"320\\\\\\\"],[\\\\\\\"Anne Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Oedo Kuuka Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Oedo Ninon Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Transfer Student Aoi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Chloe Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Halloween Mimi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Christmas Ilya Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Ice Claymore\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Chaos Blade\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Fury Rod\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Rod of Sun\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Justice God's Staff\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"High Devil Wand\\\\\\\",\\\\\\\"8\\\\\\\"],[\\\\\\\"Mythril Plate\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Scarlet Mail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Violet Armor\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Grand Magician's Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Guardian Shield\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Faireal Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Necromancer Boots\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Aquarius Boots\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Pope's Hood\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Cat God Pendant\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Bangle of Substitution\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Moon Bracelet\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Congregation Pendant\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Mourning Crescent Moon\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Dragon's Tear\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Great Sage Gem\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Lightning Blade\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Dawn's Holy Sword\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Great Sword of Sin\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Konominato Sword - Aqua Ruler\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Overlord Light Dragon Sword\\\\\\\",\\\\\\\"8\\\\\\\"],[\\\\\\\"Emerald Wind God's Tachi\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Emerald Dagger\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Lava Edge\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Tír na nÓg Dagger\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Twin God Sword of Lightning\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Heavenly Black Sword of Obsidian\\\\\\\",\\\\\\\"9\\\\\\\"],[\\\\\\\"Storm God Tempest Gear\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Extremely Dark Nail - Bloody Howl\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Abyss Bow\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Heavenly Red Bow\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Armored Bow - Deus Fall\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ice Bow - Freezing Tear\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"God Roar Axe - Terra Break\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Machine Axe - Core Breaker\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Xenosphere Rod\\\\\\\",\\\\\\\"8\\\\\\\"],[\\\\\\\"Genesis Rod\\\\\\\",\\\\\\\"9\\\\\\\"],[\\\\\\\"Lightning Wand\\\\\\\",\\\\\\\"8\\\\\\\"],[\\\\\\\"Black Snake Dragon's Staff\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Abyss Moon Staff - Sacrifice\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Phantasm Mail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Nine Heavens' Armor\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Rage Queen Dress\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Senka Dance Armor\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Beautiful Clothes - Soul Rose\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Furious Wind Armor\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Aegis Coat\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Maiden Cloth\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Fire Oni's Tori\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Extremely Dark Clothes\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Flowing Blue Dress - Azul Rondo\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Empress Robe\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Exomagia Robe\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Refreshing Ice Garment\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Astrologer's Holy Spirit Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Astrograph Buckler\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Glowing Silver Mirror Shield\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Infernal Greaves\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Sky Soaring Gold Shoes\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Royal Guard Hat\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Mourning Crown\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Prosperity Veil\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Millennium Earrings\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Fury Dragon Pendant\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"War God's Arm\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Flowering Fire Peony\\\\\\\",\\\\\\\"15\\\\\\\"],[\\\\\\\"Scarlet Dragon's Claw Fire Ring\\\\\\\",\\\\\\\"9\\\\\\\"],[\\\\\\\"Fairy King's Guardian Stone\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Mermaid Princess' Spirit Tear\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Glorious King's Shield Bangle\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sea Dragon God's Hair Ornament\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Shield God Ring - Wall Breath\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Ocean God's Earrings\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Divine Beast's Prayer\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Sophos Bracelet\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Little Ice Princess' Knot\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Deep Crystallized Xenocrystal\\\\\\\",\\\\\\\"1\\\\\\\"]]\\\"],[\\\"General (completed list)\\\",\\\"[[\\\\\\\"Yuki Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Kasumi Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Mimi Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Kurumi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Ninon Shard\\\\\\\",\\\\\\\"320\\\\\\\"],[\\\\\\\"Akino Shard\\\\\\\",\\\\\\\"50\\\\\\\"],[\\\\\\\"Mahiru Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Mifuyu Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Misaki Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Arisa Shard\\\\\\\",\\\\\\\"320\\\\\\\"],[\\\\\\\"Oedo Kuuka Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Oedo Ninon Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Transfer Student Aoi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Chloe Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Halloween Mimi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Christmas Ilya Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Yukari Pure Shard\\\\\\\",\\\\\\\"50\\\\\\\"],[\\\\\\\"Laurel's Sorrow\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Artemis Bow\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Spirit Tree Bow\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Fury Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Rod of Sun\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Justice God's Staff\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"High Devil Wand\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Heavenly Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Dark Terror Dress\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Necromancer Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Aquarius Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Pope's Hood\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Sun Amulet\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Firelord's Ring\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Cat God Pendant\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Mourning Crescent Moon\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Dragon's Tear\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Great Sage Gem\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Konominato Sword - Aqua Ruler\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Overlord Light Dragon Sword\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Emerald Dagger\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Lava Edge\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Tír na nÓg Dagger\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Twin God Sword of Lightning\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Heavenly Black Sword of Obsidian\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Cocytus Nail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Storm God Tempest Gear\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Extremely Dark Nail - Bloody Howl\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Silver Wing Bow\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Abyss Bow\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Heavenly Red Bow\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Armored Bow - Deus Fall\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Ice Bow - Freezing Tear\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Gaia Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"God Roar Axe - Terra Break\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Xenosphere Rod\\\\\\\",\\\\\\\"8\\\\\\\"],[\\\\\\\"Genesis Rod\\\\\\\",\\\\\\\"9\\\\\\\"],[\\\\\\\"Lightning Wand\\\\\\\",\\\\\\\"11\\\\\\\"],[\\\\\\\"Black Snake Dragon's Staff\\\\\\\",\\\\\\\"8\\\\\\\"],[\\\\\\\"Abyss Moon Staff - Sacrifice\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Phantasm Mail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Nine Heavens' Armor\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Beautiful Clothes - Soul Rose\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Aegis Coat\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Maiden Cloth\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Fire Oni's Tori\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Extremely Dark Clothes\\\\\\\",\\\\\\\"7\\\\\\\"],[\\\\\\\"Flowing Blue Dress - Azul Rondo\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Empress Robe\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Exomagia Robe\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Astrologer's Holy Spirit Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Astrograph Buckler\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Infernal Greaves\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Sky Soaring Gold Shoes\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Royal Guard Hat\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Mourning Crown\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Prosperity Veil\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Millennium Earrings\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Fury Dragon Pendant\\\\\\\",\\\\\\\"9\\\\\\\"],[\\\\\\\"War God's Arm\\\\\\\",\\\\\\\"10\\\\\\\"],[\\\\\\\"Flowering Fire Peony\\\\\\\",\\\\\\\"10\\\\\\\"],[\\\\\\\"Scarlet Dragon's Claw Fire Ring\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Ocean God's Earrings\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Divine Beast's Prayer\\\\\\\",\\\\\\\"7\\\\\\\"],[\\\\\\\"Sophos Bracelet\\\\\\\",\\\\\\\"7\\\\\\\"],[\\\\\\\"Little Ice Princess' Knot\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Deep Crystallized Xenocrystal\\\\\\\",\\\\\\\"1\\\\\\\"]]\\\"],[\\\"General (completed list) 2\\\",\\\"[[\\\\\\\"Yuki Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Kasumi Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Mimi Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Kurumi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Ninon Shard\\\\\\\",\\\\\\\"320\\\\\\\"],[\\\\\\\"Akino Shard\\\\\\\",\\\\\\\"50\\\\\\\"],[\\\\\\\"Mahiru Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Mifuyu Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Misaki Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Arisa Shard\\\\\\\",\\\\\\\"320\\\\\\\"],[\\\\\\\"Oedo Kuuka Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Oedo Ninon Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Transfer Student Aoi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Chloe Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Halloween Mimi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Christmas Ilya Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Yukari Pure Shard\\\\\\\",\\\\\\\"50\\\\\\\"],[\\\\\\\"Laurel's Sorrow\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Artemis Bow\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Spirit Tree Bow\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Fury Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Rod of Sun\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Justice God's Staff\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"High Devil Wand\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Heavenly Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Dark Terror Dress\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Necromancer Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Aquarius Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Pope's Hood\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Sun Amulet\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Firelord's Ring\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Cat God Pendant\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Mourning Crescent Moon\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Dragon's Tear\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Great Sage Gem\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Konominato Sword - Aqua Ruler\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Overlord Light Dragon Sword\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Emerald Dagger\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Lava Edge\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Tír na nÓg Dagger\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Twin God Sword of Lightning\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Heavenly Black Sword of Obsidian\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Cocytus Nail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Storm God Tempest Gear\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Extremely Dark Nail - Bloody Howl\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Silver Wing Bow\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Abyss Bow\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Heavenly Red Bow\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Armored Bow - Deus Fall\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Ice Bow - Freezing Tear\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Gaia Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"God Roar Axe - Terra Break\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Xenosphere Rod\\\\\\\",\\\\\\\"8\\\\\\\"],[\\\\\\\"Genesis Rod\\\\\\\",\\\\\\\"9\\\\\\\"],[\\\\\\\"Lightning Wand\\\\\\\",\\\\\\\"11\\\\\\\"],[\\\\\\\"Black Snake Dragon's Staff\\\\\\\",\\\\\\\"8\\\\\\\"],[\\\\\\\"Abyss Moon Staff - Sacrifice\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Phantasm Mail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Nine Heavens' Armor\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Beautiful Clothes - Soul Rose\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Aegis Coat\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Maiden Cloth\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Fire Oni's Tori\\\\\\\",\\\\\\\"6\\\\\\\"],[\\\\\\\"Extremely Dark Clothes\\\\\\\",\\\\\\\"7\\\\\\\"],[\\\\\\\"Flowing Blue Dress - Azul Rondo\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Empress Robe\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Exomagia Robe\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Astrologer's Holy Spirit Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Astrograph Buckler\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Infernal Greaves\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Sky Soaring Gold Shoes\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Royal Guard Hat\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Mourning Crown\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Prosperity Veil\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Millennium Earrings\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Fury Dragon Pendant\\\\\\\",\\\\\\\"9\\\\\\\"],[\\\\\\\"War God's Arm\\\\\\\",\\\\\\\"10\\\\\\\"],[\\\\\\\"Flowering Fire Peony\\\\\\\",\\\\\\\"10\\\\\\\"],[\\\\\\\"Scarlet Dragon's Claw Fire Ring\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Sea Dragon God's Hair Ornament\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Ocean God's Earrings\\\\\\\",\\\\\\\"5\\\\\\\"],[\\\\\\\"Divine Beast's Prayer\\\\\\\",\\\\\\\"7\\\\\\\"],[\\\\\\\"Sophos Bracelet\\\\\\\",\\\\\\\"7\\\\\\\"],[\\\\\\\"Little Ice Princess' Knot\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Deep Crystallized Xenocrystal\\\\\\\",\\\\\\\"1\\\\\\\"]]\\\"],[\\\"General backup\\\",\\\"[[\\\\\\\"Yuki Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Kasumi Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Mimi Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Kurumi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Ninon Shard\\\\\\\",\\\\\\\"320\\\\\\\"],[\\\\\\\"Akino Shard\\\\\\\",\\\\\\\"50\\\\\\\"],[\\\\\\\"Mahiru Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Mifuyu Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Misaki Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Arisa Shard\\\\\\\",\\\\\\\"320\\\\\\\"],[\\\\\\\"Anne Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Oedo Kuuka Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Oedo Ninon Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Transfer Student Aoi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Chloe Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Halloween Mimi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Christmas Ilya Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Yukari Pure Shard\\\\\\\",\\\\\\\"50\\\\\\\"]]\\\"],[\\\"Shards only\\\",\\\"[[\\\\\\\"Yuki Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Kasumi Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Mimi Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Kurumi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Ninon Shard\\\\\\\",\\\\\\\"320\\\\\\\"],[\\\\\\\"Akino Shard\\\\\\\",\\\\\\\"50\\\\\\\"],[\\\\\\\"Mahiru Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Mifuyu Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Misaki Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Arisa Shard\\\\\\\",\\\\\\\"320\\\\\\\"],[\\\\\\\"Anne Shard\\\\\\\",\\\\\\\"200\\\\\\\"],[\\\\\\\"Oedo Kuuka Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Oedo Ninon Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Transfer Student Aoi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Chloe Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Halloween Mimi Shard\\\\\\\",\\\\\\\"270\\\\\\\"],[\\\\\\\"Christmas Ilya Shard\\\\\\\",\\\\\\\"150\\\\\\\"],[\\\\\\\"Yukari Pure Shard\\\\\\\",\\\\\\\"50\\\\\\\"]]\\\"]]\",\"inventory\":\"{\\\"fragments\\\":{\\\"Yui Shard\\\":40,\\\"Rei Shard\\\":72,\\\"Yuki Shard\\\":38,\\\"Kasumi Shard\\\":34,\\\"Mimi Shard\\\":106,\\\"Kurumi Shard\\\":117,\\\"Eriko Shard\\\":91,\\\"Shinobu Shard\\\":40,\\\"Akino Shard\\\":37,\\\"Mahiru Shard\\\":16,\\\"Kyouka Shard\\\":76,\\\"Tomo Shard\\\":92,\\\"Shiori Shard\\\":53,\\\"Aoi Shard\\\":25,\\\"Ilya Shard\\\":64,\\\"Jun Shard\\\":51,\\\"Mifuyu Shard\\\":22,\\\"Shizuru Shard\\\":34,\\\"Misaki Shard\\\":135,\\\"Rima Shard\\\":23,\\\"Ruka Shard\\\":3,\\\"Djeeta Shard\\\":13,\\\"Pecorine Shard\\\":23,\\\"Kokkoro Shard\\\":38,\\\"Arisa Shard\\\":76,\\\"Anne Shard\\\":2,\\\"Grea Shard\\\":42,\\\"Oedo Kuuka Shard\\\":56,\\\"Oedo Ninon Shard\\\":90,\\\"Transfer Student Aoi Shard\\\":1,\\\"Rima Pure Shard\\\":52,\\\"Luna Shard\\\":100,\\\"Io Pure Shard\\\":1,\\\"Kaya Shard\\\":2,\\\"Deep Crystallized Xenocrystal Fragment\\\":90,\\\"Little Ice Princess' Knot Fragment\\\":98,\\\"Sophos Bracelet Fragment\\\":171,\\\"Divine Beast's Prayer Fragment\\\":179,\\\"Ocean God's Earrings Fragment\\\":170,\\\"Shield God Ring - Wall Breath Fragment\\\":192,\\\"Sea Dragon God's Hair Ornament Fragment\\\":17,\\\"Glorious King's Shield Bangle Fragment\\\":136,\\\"Mermaid Princess' Spirit Tear Fragment\\\":125,\\\"Fairy King's Guardian Stone Fragment\\\":220,\\\"Scarlet Dragon's Claw Fire Ring Fragment\\\":13,\\\"Flowering Fire Peony Fragment\\\":49,\\\"War God's Arm Fragment\\\":218,\\\"Fury Dragon Pendant Fragment\\\":20,\\\"Millennium Earrings Fragment\\\":120,\\\"Prosperity Veil Fragment\\\":92,\\\"Holy Prayer's Crown Fragment\\\":233,\\\"Mourning Crown Fragment\\\":172,\\\"Royal Guard Hat Fragment\\\":129,\\\"Glowing Silver Mirror Boots Fragment\\\":19,\\\"Blood Ruby Heel Fragment\\\":214,\\\"Sky Soaring Gold Shoes Fragment\\\":94,\\\"Infernal Greaves Fragment\\\":190,\\\"Glowing Silver Mirror Shield Fragment\\\":26,\\\"Astrograph Buckler Fragment\\\":47,\\\"Astrologer's Holy Spirit Robe Fragment\\\":65,\\\"Refreshing Ice Garment Fragment\\\":37,\\\"Exomagia Robe Fragment\\\":426,\\\"Empress Robe Fragment\\\":67,\\\"Shrine Maiden's Purity Cloth Fragment\\\":60,\\\"Flowing Blue Dress - Azul Rondo Fragment\\\":22,\\\"Extremely Dark Clothes Fragment\\\":116,\\\"Fire Oni's Tori Fragment\\\":235,\\\"Maiden Cloth Fragment\\\":117,\\\"Aegis Coat Fragment\\\":102,\\\"Glowing Silver Mirror Armor Fragment\\\":23,\\\"Furious Wind Armor Fragment\\\":50,\\\"Gold King's Armor Fragment\\\":315,\\\"Holy Sakura's Armor Fragment\\\":299,\\\"Azure Armor Fragment\\\":152,\\\"Beautiful Clothes - Soul Rose Fragment\\\":73,\\\"Senka Dance Armor Fragment\\\":93,\\\"Rage Queen Dress Fragment\\\":415,\\\"Nine Heavens' Armor Fragment\\\":218,\\\"Phantasm Mail Fragment\\\":46,\\\"World Tree's Branch Wand Fragment\\\":113,\\\"Heaven Rod - Stellar Sphere Fragment\\\":320,\\\"Atlantis Rod Fragment\\\":384,\\\"Divine Blossom Rod Fragment\\\":256,\\\"Flame Rod Fragment\\\":50,\\\"Abyss Moon Staff - Sacrifice Fragment\\\":31,\\\"Black Snake Dragon's Staff Fragment\\\":132,\\\"Lightning Wand Fragment\\\":298,\\\"Genesis Rod Fragment\\\":147,\\\"Xenosphere Rod Fragment\\\":77,\\\"Machine Axe - Core Breaker Fragment\\\":39,\\\"God Roar Axe - Terra Break Fragment\\\":31,\\\"Gaia Axe Fragment\\\":165,\\\"Divine Judgement Axe Fragment\\\":278,\\\"Necrodim Axe Fragment\\\":176,\\\"Fire Spear - Prominence Fragment\\\":79,\\\"Divine Spear - Doom Pain Fragment\\\":296,\\\"Heaven's Protective Holy Spear Fragment\\\":300,\\\"Gale Stinger Fragment\\\":417,\\\"Zero Frost Lance Fragment\\\":126,\\\"Ice Bow - Freezing Tear Fragment\\\":44,\\\"Armored Bow - Deus Fall Fragment\\\":117,\\\"Heavenly Red Bow Fragment\\\":205,\\\"Abyss Bow Fragment\\\":33,\\\"Silver Wing Bow Fragment\\\":307,\\\"Extremely Dark Nail - Bloody Howl Fragment\\\":98,\\\"Storm God Tempest Gear Fragment\\\":52,\\\"Cocytus Nail Fragment\\\":193,\\\"Crimson Claw Fragment\\\":164,\\\"Moon Cestus Fragment\\\":99,\\\"Heavenly Black Sword of Obsidian Fragment\\\":41,\\\"Twin God Sword of Lightning Fragment\\\":197,\\\"Tír na nÓg Dagger Fragment\\\":146,\\\"Lava Edge Fragment\\\":262,\\\"Emerald Dagger Fragment\\\":43,\\\"Emerald Wind God's Tachi Fragment\\\":28,\\\"Ifrit Katana - Ignite Fragment\\\":163,\\\"Blood Raven Sword Fragment\\\":315,\\\"Flowing Azure Blade Fragment\\\":216,\\\"Hundred White Blossom Petals Sword Fragment\\\":69,\\\"Overlord Light Dragon Sword Fragment\\\":15,\\\"Konominato Sword - Aqua Ruler Fragment\\\":151,\\\"Great Sword of Sin Fragment\\\":247,\\\"Dawn's Holy Sword Fragment\\\":204,\\\"Lightning Blade Fragment\\\":87,\\\"Great Sage Gem Fragment\\\":192,\\\"Dragon's Tear Fragment\\\":96,\\\"Mourning Crescent Moon Fragment\\\":232,\\\"Congregation Pendant Fragment\\\":111,\\\"Moon Bracelet Fragment\\\":121,\\\"Bangle of Substitution Fragment\\\":188,\\\"Cat God Pendant Fragment\\\":85,\\\"Firelord's Ring Fragment\\\":62,\\\"Sun Amulet Fragment\\\":30,\\\"Elemental Heart Fragment\\\":123,\\\"Gospel Tiara Fragment\\\":170,\\\"Pope's Hood Fragment\\\":283,\\\"Wizard Hood Fragment\\\":215,\\\"Feather Waltz Fragment\\\":208,\\\"Aquarius Boots Fragment\\\":267,\\\"Necromancer Boots Fragment\\\":339,\\\"Wizard Boots Fragment\\\":47,\\\"Faireal Boots Fragment\\\":33,\\\"Angel Boots Fragment\\\":254,\\\"Paladin Greave Fragment\\\":104,\\\"Guardian Shield Fragment\\\":74,\\\"Empress Shield Fragment\\\":162,\\\"Viridian Spiritual Dress Fragment\\\":200,\\\"Saint's Robe Fragment\\\":223,\\\"Grand Magician's Robe Fragment\\\":319,\\\"Dark Terror Dress Fragment\\\":66,\\\"Heavenly Robe Fragment\\\":134,\\\"Hermit Clothes Fragment\\\":62,\\\"Moonlight Garment Fragment\\\":36,\\\"Dragonic Armor Fragment\\\":37,\\\"Violet Armor Fragment\\\":438,\\\"Vermilion Plate Fragment\\\":229,\\\"Angel Armor Fragment\\\":222,\\\"Scarlet Mail Fragment\\\":160,\\\"Crusader Plate Fragment\\\":199,\\\"Mythril Plate Fragment\\\":213,\\\"Invisible Dress Fragment\\\":18,\\\"High Angel Rod Fragment\\\":128,\\\"Phoenix Rod Fragment\\\":379,\\\"Rod of Life Fragment\\\":429,\\\"Moon Wand Fragment\\\":118,\\\"High Devil Wand Fragment\\\":194,\\\"Justice God's Staff Fragment\\\":77,\\\"Rod of Sun Fragment\\\":172,\\\"Fury Rod Fragment\\\":6,\\\"Aqua Slasher Fragment\\\":96,\\\"Queen's Battle Axe Fragment\\\":40,\\\"Hell-Fire Axe Fragment\\\":287,\\\"Shiryuu Axe Fragment\\\":83,\\\"Gaia Bardiche Fragment\\\":142,\\\"Storm Bringer Fragment\\\":332,\\\"Queen Bee Spear Fragment\\\":461,\\\"Scarlet Dragon Fragment\\\":99,\\\"Spirit Tree Bow Fragment\\\":30,\\\"Artemis Bow Fragment\\\":45,\\\"Angel Bow Fragment\\\":329,\\\"Lightning Bow Fragment\\\":113,\\\"Lightning Fist Fragment\\\":268,\\\"Blizzard Claw Fragment\\\":192,\\\"Lion King Gauntlet Fragment\\\":344,\\\"Blazing Gauntlet Fragment\\\":250,\\\"Unicorn Knife Fragment\\\":164,\\\"Dark Matter Edge Fragment\\\":211,\\\"Princess' Dagger Fragment\\\":93,\\\"Precious Knife Fragment\\\":229,\\\"Phoenix Sword Fragment\\\":66,\\\"Hawk God's Sword Fragment\\\":132,\\\"Bright Sword Fragment\\\":242,\\\"Butterfly Katana Fragment\\\":69,\\\"Chaos Blade Fragment\\\":307,\\\"Ice Claymore Fragment\\\":2,\\\"Solar Sword Fragment\\\":364,\\\"Angel Blade Fragment\\\":97,\\\"Chloe Shard\\\":1,\\\"Yukari Pure Shard\\\":47,\\\"Christmas Ilya Shard\\\":100,\\\"Laurel's Sorrow Fragment\\\":203,\\\"Turquoise Earrings Fragment\\\":225,\\\"Pearl Earrings Fragment\\\":260,\\\"Lion King's Protective Charm Fragment\\\":304,\\\"Octogram Pendant Fragment\\\":309,\\\"Emerald Earrings Fragment\\\":44,\\\"Scarlet Diamond Fragment\\\":191,\\\"Opal Earrings Fragment\\\":131,\\\"Witch Hat Fragment\\\":147,\\\"Witch Headband Fragment\\\":235,\\\"Dragon Head Fragment\\\":279,\\\"Witch Palace Boots Fragment\\\":306,\\\"Fencer Boots Fragment\\\":346,\\\"Shinobi Shoes Fragment\\\":261,\\\"Garnet Shield Fragment\\\":170,\\\"Philosopher's Robe Fragment\\\":429,\\\"Cupid Robe Fragment\\\":282,\\\"Cosmos Cloth Fragment\\\":340,\\\"Palace Cloth Fragment\\\":276,\\\"Millefeuille Cloth Fragment\\\":276,\\\"Gorgeous Armor Fragment\\\":334,\\\"Heavy Metal Armor Fragment\\\":236,\\\"Battling Dress Fragment\\\":256,\\\"Fashion Armor Fragment\\\":306,\\\"Flower Bud Wand Fragment\\\":204,\\\"Celestial Sphere Watcher Fragment\\\":331,\\\"Devil's Horn Fragment\\\":209,\\\"Thorn Blood Rod Fragment\\\":212,\\\"Lightning Axe Fragment\\\":384,\\\"Lion's Battle Axe Fragment\\\":272,\\\"Blue Sphere Axe Fragment\\\":204,\\\"Absolute Spear Fragment\\\":110,\\\"Knight's Pride Fragment\\\":308,\\\"Devil's Bow Fragment\\\":297,\\\"Cupid's Bow Fragment\\\":147,\\\"Dragon's Claw Fragment\\\":214,\\\"Vampire Dagger Fragment\\\":268,\\\"Platinum Knife Fragment\\\":216,\\\"Thunder God Sword Fragment\\\":287,\\\"Moonlight Sword Fragment\\\":288,\\\"Feather Blade Fragment\\\":152,\\\"Ryuumon Sword Fragment\\\":239,\\\"Sparkling Sword Fragment\\\":358,\\\"Pattern Bracelet Fragment\\\":260,\\\"Magic Monocle Fragment\\\":280,\\\"Jewel of Wisdom\\\":3,\\\"Magic Glasses\\\":80,\\\"Victory Friendship Bracelet\\\":219,\\\"Jewel of Love\\\":93,\\\"Spike Bangle\\\":245,\\\"Jewel of Courage\\\":76,\\\"Nun's Hood Fragment\\\":265,\\\"Legion Helm Fragment\\\":118,\\\"Cute Caskets Fragment\\\":189,\\\"Witch Boots\\\":136,\\\"Hunting Boots Fragment\\\":213,\\\"Crown Boots Fragment\\\":212,\\\"Tower Shield Fragment\\\":206,\\\"Nordic Robe Fragment\\\":217,\\\"Spring Color Robe Fragment\\\":60,\\\"Shinobi Costume Fragment\\\":217,\\\"Folklore Clothes Fragment\\\":126,\\\"High Metal Plate Fragment\\\":213,\\\"Scale Mail Fragment\\\":161,\\\"Light Plate Fragment\\\":211,\\\"Clothes of Wisdom\\\":444,\\\"Compassion of the Unicorn\\\":227,\\\"Doctorless Staff\\\":107,\\\"Little Dragon Rod\\\":219,\\\"Green Rod\\\":116,\\\"High-Metal Axe\\\":215,\\\"Metal Axe\\\":121,\\\"Flame Spear\\\":204,\\\"Trident\\\":152,\\\"Crystal Bow\\\":223,\\\"Leather Knuckle\\\":211,\\\"Command Knife\\\":129,\\\"Crescent Sword\\\":212,\\\"Aurora Sword\\\":205,\\\"Blue Blood\\\":204,\\\"Gear Blade\\\":142,\\\"Lion Eagle's Feather Fragment\\\":2}}\",\"settings\":\"{\\\"quest_shown_value\\\":50,\\\"ascending_sort_quest_list\\\":true,\\\"ascending_sort_quest_score\\\":false,\\\"hide_quest_score\\\":false,\\\"min_quest_chapter\\\":1,\\\"max_quest_chapter\\\":30,\\\"auto_max_quest_chapter\\\":false,\\\"quest_filter\\\":\\\"filter-all\\\",\\\"ignored_rarities\\\":[\\\"common\\\"],\\\"quest_display\\\":\\\"display-amt-req\\\",\\\"subtract_amount_from_inventory\\\":true,\\\"display_priority_item_amount\\\":true,\\\"show_priority_items_first\\\":true,\\\"normal_quest_drop_multiplier\\\":1,\\\"hard_quest_drop_multiplier\\\":1,\\\"very_hard_quest_drop_multiplier\\\":\\\"1\\\",\\\"equipment_data_type\\\":\\\"equipment-data-en\\\"}\"}"
        }
    },
    "public": false,
    "created_at": "2022-12-20T18:07:42Z",
    "updated_at": "2022-12-20T18:07:42Z",
    "description": "Export data for priconne-quest-helper.",
    "comments": 0,
    "user": null,
    "comments_url": "https://api.github.com/gists/c3e81224c7801222af0d2af314be14b1/comments",
    "owner": {
        "login": "Spugn",
        "id": 46584883,
        "node_id": "MDQ6VXNlcjQ2NTg0ODgz",
        "avatar_url": "https://avatars.githubusercontent.com/u/46584883?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/Spugn",
        "html_url": "https://github.com/Spugn",
        "followers_url": "https://api.github.com/users/Spugn/followers",
        "following_url": "https://api.github.com/users/Spugn/following{/other_user}",
        "gists_url": "https://api.github.com/users/Spugn/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/Spugn/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/Spugn/subscriptions",
        "organizations_url": "https://api.github.com/users/Spugn/orgs",
        "repos_url": "https://api.github.com/users/Spugn/repos",
        "events_url": "https://api.github.com/users/Spugn/events{/privacy}",
        "received_events_url": "https://api.github.com/users/Spugn/received_events",
        "type": "User",
        "site_admin": false
    },
    "forks": [],
    "history": [
        {
            "user": {
                "login": "Spugn",
                "id": 46584883,
                "node_id": "MDQ6VXNlcjQ2NTg0ODgz",
                "avatar_url": "https://avatars.githubusercontent.com/u/46584883?v=4",
                "gravatar_id": "",
                "url": "https://api.github.com/users/Spugn",
                "html_url": "https://github.com/Spugn",
                "followers_url": "https://api.github.com/users/Spugn/followers",
                "following_url": "https://api.github.com/users/Spugn/following{/other_user}",
                "gists_url": "https://api.github.com/users/Spugn/gists{/gist_id}",
                "starred_url": "https://api.github.com/users/Spugn/starred{/owner}{/repo}",
                "subscriptions_url": "https://api.github.com/users/Spugn/subscriptions",
                "organizations_url": "https://api.github.com/users/Spugn/orgs",
                "repos_url": "https://api.github.com/users/Spugn/repos",
                "events_url": "https://api.github.com/users/Spugn/events{/privacy}",
                "received_events_url": "https://api.github.com/users/Spugn/received_events",
                "type": "User",
                "site_admin": false
            },
            "version": "4841f887663d7d632488b5bb87a4ea2437b7fb0e",
            "committed_at": "2022-12-20T18:07:42Z",
            "change_status": {
                "total": 1,
                "additions": 1,
                "deletions": 0
            },
            "url": "https://api.github.com/gists/c3e81224c7801222af0d2af314be14b1/4841f887663d7d632488b5bb87a4ea2437b7fb0e"
        }
    ],
    "truncated": false
};
    }


    function getTestResult3() {
        return {
    "url": "https://api.github.com/gists/efdfa79bc42dabe194163198b1e2f512",
    "forks_url": "https://api.github.com/gists/efdfa79bc42dabe194163198b1e2f512/forks",
    "commits_url": "https://api.github.com/gists/efdfa79bc42dabe194163198b1e2f512/commits",
    "id": "efdfa79bc42dabe194163198b1e2f512",
    "node_id": "G_kwDOAsbUM9oAIGVmZGZhNzliYzQyZGFiZTE5NDE2MzE5OGIxZTJmNTEy",
    "git_pull_url": "https://gist.github.com/efdfa79bc42dabe194163198b1e2f512.git",
    "git_push_url": "https://gist.github.com/efdfa79bc42dabe194163198b1e2f512.git",
    "html_url": "https://gist.github.com/efdfa79bc42dabe194163198b1e2f512",
    "files": {
        "priconne-quest-helper_data.json": {
            "filename": "priconne-quest-helper_data.json",
            "type": "application/json",
            "language": "JSON",
            "raw_url": "https://gist.githubusercontent.com/Spugn/efdfa79bc42dabe194163198b1e2f512/raw/c7c585616745f3e04665a6e703b895bbf3b6b650/priconne-quest-helper_data.json",
            "size": 9964,
            "truncated": false,
            "content": "{\"projects\":\"[[\\\"Ameth [1 - 27]\\\",\\\"[[\\\\\\\"Fragrant Wood Wand\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Journey Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Fashionable Beret\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Protective Pendant\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Fighting Bracelet\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Doctorless Staff\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Compassion of the Unicorn\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Spring Color Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Nordic Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Witch Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Nun's Hood\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Jewel of Love\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Jewel of Wisdom\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Magic Monocle\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Pattern Bracelet\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Devil's Horn\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Celestial Sphere Watcher\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Flower Bud Wand\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Cupid Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Philosopher's Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Witch Palace Boots\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Witch Headband\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Witch Hat\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Emerald Earrings\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Pearl Earrings\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Sorcerer's Glasses\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Laurel's Sorrow\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Moon Wand\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Rod of Life\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Phoenix Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"High Angel Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Grand Magician's Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Saint's Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Viridian Spiritual Dress\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Wizard Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Pope's Hood\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Gospel Tiara\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Mourning Crescent Moon\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Dragon's Tear\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Great Sage Gem\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Flame Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Divine Blossom Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Atlantis Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Heaven Rod - Stellar Sphere\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"World Tree's Branch Wand\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Phoenix Staff - Rise Flare\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"White Snake's Holy Water Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Shrine Maiden's Purity Cloth\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Empress Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Exomagia Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Refreshing Ice Garment\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Blood Ruby Heel\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Glowing Silver Mirror Boots\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Pride of the Roses\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Holy Prayer's Crown\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Heavenly Wing Wise Saint Hat\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Fairy King's Guardian Stone\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Mermaid Princess' Spirit Tear\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Glorious King's Shield Bangle\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sea Dragon God's Hair Ornament\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Shield God Ring - Wall Breath\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Elfin Choker\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Jade Harp Brooch\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Heavenly Wand of the White Pearl\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Triple Ice Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Icy Snow Flower Cane\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Magic Pancake Robe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Moon Crystal Heels\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sakura Blizzard Woven Heels\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sheet Tart Beret\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Evergreen Green Ring\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Macaron Pendant\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Whirlwind Earrings\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sakura Dance Wand\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Jellyfish Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Punk Princess Rod\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Hibiscus Sandals\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Studded Black\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Frost Column Heel\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sakura Flower Moonlight Hairpin\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Pearl Coconut Hair Ornament\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Emerald Gothic Bangle\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ice Cane Frost Staff\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Charitable Command Staff Artemakillion\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Desert Rain Cane\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Rose Petal Staff\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Oriental Breeze Robe\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Magical Hat Tambourine Caskets\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Rose Sorcerer's Magic Banquet Hat\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Green Aurora Ring\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Celestial Beating Timpania\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ancient Emerald\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Rose Brute Pendant\\\\\\\",\\\\\\\"1\\\\\\\"]]\\\"],[\\\"Djeeta [1 - 13]\\\",\\\"[[\\\\\\\"Iron Blade\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Leather Overalls\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Tree Shield\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Motivational Bracelet\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Gear Blade\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Blue Blood\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Clothes of Wisdom\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Light Plate\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Tower Shield\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Legion Helm\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Jewel of Courage\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Spike Bangle\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sparkling Sword\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ryuumon Sword\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Feather Blade\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Platinum Knife\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Fashion Armor\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Battling Dress\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Heavy Metal Armor\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Garnet Shield\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Shinobi Shoes\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Opal Earrings\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Lion Eagle's Feather\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Scarlet Diamond\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Angel Blade\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Solar Sword\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Ice Claymore\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Chaos Blade\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Invisible Dress\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Mythril Plate\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Scarlet Mail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Guardian Shield\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Elemental Heart\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sun Amulet\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Firelord's Ring\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Cat God Pendant\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Lightning Blade\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Dawn's Holy Sword\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Great Sword of Sin\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Konominato Sword - Aqua Ruler\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Phantasm Mail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Nine Heavens' Armor\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Fire Oni's Tori\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Millennium Earrings\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Fury Dragon Pendant\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"War God's Arm\\\\\\\",\\\\\\\"1\\\\\\\"]]\\\"],[\\\"Mimi (Halloween) [1 - 27]\\\",\\\"[[\\\\\\\"Iron Blade\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"One Handed Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Leather Overalls\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Tree Shield\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Motivational Bracelet\\\\\\\",\\\\\\\"4\\\\\\\"],[\\\\\\\"Gear Blade\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Blue Blood\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"High-Metal Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Scale Mail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"High Metal Plate\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Tower Shield\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Legion Helm\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Jewel of Courage\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Spike Bangle\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sparkling Sword\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ryuumon Sword\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Feather Blade\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Lion's Battle Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Fashion Armor\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Battling Dress\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Heavy Metal Armor\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Shinobi Shoes\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Dragon Head\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Opal Earrings\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Lion Eagle's Feather\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Scarlet Diamond\\\\\\\",\\\\\\\"3\\\\\\\"],[\\\\\\\"Angel Blade\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Solar Sword\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Ice Claymore\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Chaos Blade\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Shiryuu Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Hell-Fire Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Queen's Battle Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Aqua Slasher\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Invisible Dress\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Mythril Plate\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Scarlet Mail\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Guardian Shield\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Angel Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Faireal Boots\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Feather Waltz\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Elemental Heart\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sun Amulet\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Firelord's Ring\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Cat God Pendant\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Lightning Blade\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Dawn's Holy Sword\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Great Sword of Sin\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Konominato Sword - Aqua Ruler\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Overlord Light Dragon Sword\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Star Nuclear Sword - Ertz Schneide\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Rabbit God's Great Sword\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Necrodim Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Divine Judgement Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Gaia Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"God Roar Axe - Terra Break\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Machine Axe - Core Breaker\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Turquoise Noah\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Red Bear Emperor's Claw Battle Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Beautiful Clothes - Soul Rose\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Holy Light's Lily Plate\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Holy Sakura's Armor\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Eastern Heaven Green Wind Dress\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Astrograph Buckler\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Infernal Greaves\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Sky Soaring Gold Shoes\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Royal Guard Hat\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Millennium Earrings\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Fury Dragon Pendant\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"War God's Arm\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Flowering Fire Peony\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Scarlet Dragon's Claw Fire Ring\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ruby Rose Choker\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Cardinal Clarion Brooch\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Shining Sword - Adamas\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Choco Stick Blade\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Blazing Red Sun Sword\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Brass Cleft Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Crepe Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Polar Light Belt Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Platinum Scale Armor\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Chocolate Mail\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Evening Sakura Purple Armor\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Godly Red Ring - Ruby Rose\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Popcorn Necklace\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Heavenly Hell Earrings\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Cherry Blossom\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Clione Blade\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Riot Spike\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Sakura Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Whale Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Rocking Groove Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Gothic Maiden\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Crystal Ice Mail\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sunflower Straw Hat\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Sakura Dance Double Hairpin\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ruby Hibiscus Hair Ornament\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Punk Needle Bangle\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ice Shining Sword Glass Blade\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Sword Field Sword Grand Pianos\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Oasis Guard Blade\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Rose Imperial Sword\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Ice Breaking Riot Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Heavenly Sound Axe Buster Horn\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Oasis Faas\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Rose Crusher Axe\\\\\\\",\\\\\\\"1\\\\\\\"],[\\\\\\\"Desert Clothmail\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Rose Priestess Dress\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Tributal Dancing Pumps\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ice Pillar Ring\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Tree Tributing Xylophonia\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Ancient Ruby\\\\\\\",\\\\\\\"2\\\\\\\"],[\\\\\\\"Rose Rogue Pendant\\\\\\\",\\\\\\\"1\\\\\\\"]]\\\"]]\",\"priority_projects\":\"[\\\"Djeeta [1 - 13]\\\"]\",\"inventory\":\"{\\\"fragments\\\":{\\\"Glorious King's Shield Bangle Fragment\\\":30,\\\"Black Snake Dragon's Staff Fragment\\\":16,\\\"Elemental Heart Fragment\\\":10,\\\"Ice Shining Sword Glass Blade Fragment\\\":33}}\"}"
        }
    },
    "public": false,
    "created_at": "2022-12-20T21:14:35Z",
    "updated_at": "2022-12-20T21:14:35Z",
    "description": "Export data for priconne-quest-helper.",
    "comments": 0,
    "user": null,
    "comments_url": "https://api.github.com/gists/efdfa79bc42dabe194163198b1e2f512/comments",
    "owner": {
        "login": "Spugn",
        "id": 46584883,
        "node_id": "MDQ6VXNlcjQ2NTg0ODgz",
        "avatar_url": "https://avatars.githubusercontent.com/u/46584883?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/Spugn",
        "html_url": "https://github.com/Spugn",
        "followers_url": "https://api.github.com/users/Spugn/followers",
        "following_url": "https://api.github.com/users/Spugn/following{/other_user}",
        "gists_url": "https://api.github.com/users/Spugn/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/Spugn/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/Spugn/subscriptions",
        "organizations_url": "https://api.github.com/users/Spugn/orgs",
        "repos_url": "https://api.github.com/users/Spugn/repos",
        "events_url": "https://api.github.com/users/Spugn/events{/privacy}",
        "received_events_url": "https://api.github.com/users/Spugn/received_events",
        "type": "User",
        "site_admin": false
    },
    "forks": [],
    "history": [
        {
            "user": {
                "login": "Spugn",
                "id": 46584883,
                "node_id": "MDQ6VXNlcjQ2NTg0ODgz",
                "avatar_url": "https://avatars.githubusercontent.com/u/46584883?v=4",
                "gravatar_id": "",
                "url": "https://api.github.com/users/Spugn",
                "html_url": "https://github.com/Spugn",
                "followers_url": "https://api.github.com/users/Spugn/followers",
                "following_url": "https://api.github.com/users/Spugn/following{/other_user}",
                "gists_url": "https://api.github.com/users/Spugn/gists{/gist_id}",
                "starred_url": "https://api.github.com/users/Spugn/starred{/owner}{/repo}",
                "subscriptions_url": "https://api.github.com/users/Spugn/subscriptions",
                "organizations_url": "https://api.github.com/users/Spugn/orgs",
                "repos_url": "https://api.github.com/users/Spugn/repos",
                "events_url": "https://api.github.com/users/Spugn/events{/privacy}",
                "received_events_url": "https://api.github.com/users/Spugn/received_events",
                "type": "User",
                "site_admin": false
            },
            "version": "1de7b3be281ab3447b1af3e50c40fe50a2b079fe",
            "committed_at": "2022-12-20T21:14:34Z",
            "change_status": {
                "total": 1,
                "additions": 1,
                "deletions": 0
            },
            "url": "https://api.github.com/gists/efdfa79bc42dabe194163198b1e2f512/1de7b3be281ab3447b1af3e50c40fe50a2b079fe"
        }
    ],
    "truncated": false
};
    }
</script>

<svelte:head>
	<title>priconne-quest-helper | Data Import</title>
	<meta name="title" content="priconne-quest-helper | Data Import" />
    <meta name="description" content="priconne-quest-helper Data Importing - Transfer data between devices!" />
    <meta property="og:title" content="priconne-quest-helper | Data Import" />
    <meta property="og:description" content="priconne-quest-helper Data Importing - Transfer data between devices!" />
    <meta property="og:image" content="https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/static/logo128.png" />
    <meta property="og:url" content="https://spugn.github.io/priconne-quest-helper/data-import/" />
    <meta property="twitter:title" content="priconne-quest-helper | Data Import" />
    <meta property="twitter:description" content="priconne-quest-helper Data Importing - Transfer data between devices!" />
</svelte:head>

<div class="color-aliceblue text-center text-shadow-md font-bold py-3.5 mb-3 text-white">
    <h1 class="title text-[5vw] sm:text-3xl">Princess Connect! Re:Dive - Quest Helper</h1>
    <h2 class="title text-[4vw] sm:text-2xl tracking-widest">{legacy_import ? "Legacy " : ""}Data Import</h2>
    <h1 class="title simple">priconne-quest-helper &boxv; {legacy_import ? "Legacy " : ""}Data Import</h1>
</div>

{#if !page_error && mounted}
    <section class="flex flex-col gap-1 pb-40 mx-4 justify-center items-center text-black">
        {#if success}
            <div class="flex flex-col gap-1 py-5 justify-center items-center text-white text-shadow">
                <strong class="block text-3xl text-center">Data Import Complete!</strong>
                <small>You can now close this page or return to the main page.</small>
                <a href="/" class="flex flex-row justify-center items-center mt-4 gap-2"
                    style="color: inherit; text-decoration: none;"
                >
                    <span class="material-icons">home</span>
                    <span>Home Page</span>
                    <span class="material-icons">launch</span>
                </a>
            </div>
        {:else}
            <div class="w-full">
                <div class="text-2xl text-yellow-300 font-bold text-center text-shadow py-4">
                    Are you sure you want to import?
                </div>
                <Button variant="raised" class="w-full" on:click={() => importData()}>
                    <Icon class="material-icons">done</Icon>
                    <Label>Import Data</Label>
                </Button>
                <div class="text-white font-bold text-center text-shadow pt-4 pb-8 flex flex-col gap-1">
                    <span class="text-red-400">
                        Your existing data will be replaced on this browser if you continue.
                    </span>
                    <span class="italic">
                        Make sure everything below is correct before proceeding.
                    </span>
                </div>
            </div>
        {/if}
        {#if projects.length > 0}
            <div class="my-4 flex flex-col gap-1 shadow-md bg-white rounded w-full">
                <div class="category-title">Projects</div>
                {#if legacy_import}
                    <small class="flex flex-row flex-wrap gap-2 mx-4">
                        <span class="material-icons">info</span>
                        <span class="relative top-[0.2rem]">Legacy projects are converted to Item Projects.</span>
                    </small>
                {/if}
                <div class="flex flex-row justify-start flex-wrap gap-1">
                    {#each projects as p}
                        <MiniProjectTitle thumbnail={p.thumbnail} project_type={p.type} priority={p.priority}
                            project_name={p.project_name} subtitle={p.subtitle} start_rank={p.start_rank}
                            end_rank={p.end_rank} progress={-1}
                        />
                    {/each}
                </div>
            </div>
        {/if}
        {#if characters.length > 0}
            <div class="my-4 flex flex-col gap-1 shadow-md bg-white rounded w-full">
                <div class="category-title pb-2">Characters</div>
                <div class="flex flex-row justify-start flex-wrap gap-1 pb-3 pl-3">
                    {#each characters as c}
                        <CharacterButton id={c.id} rank={c.rank} />
                    {/each}
                </div>
            </div>
        {/if}
        {#if items.length > 0}
            <div class="my-4 flex flex-col gap-1 shadow-md bg-white rounded w-full">
                <div class="category-title pb-2">Inventory</div>
                <div class="flex flex-row justify-start flex-wrap gap-1 pb-3 pl-3">
                    {#each items as i}
                        <ItemButton id={i.id} amount={i.amount} />
                    {/each}
                </div>
            </div>
        {/if}
        {#if settings}
            <div class="my-4 flex flex-col gap-1 shadow-md bg-white rounded w-full">
                <div class="category-title pb-2">Settings</div>
                <div class="flex flex-row justify-start flex-wrap gap-1 px-3 pb-3">
                    <textarea disabled class="w-full h-auto" rows="10">{settings}</textarea>
                </div>
            </div>
        {/if}
    </section>

{:else if page_error}
    <div class="flex flex-col justify-center items-center">
        <strong>Failed to import data</strong>
        <small>Refresh the page and try again or try again at a later date.</small>
    </div>
{:else if legacy_no_data_error}
    <div class="flex flex-col justify-center items-center">
        <strong>Failed to import legacy data</strong>
        <small>No importable data was found.</small>
        <small>Only <strong>Inventory</strong> and <strong>Projects</strong> can be converted and imported from legacy data.</small>
    </div>
{/if}
<section>

</section>

<style>
    .category-title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
        padding-left: 1rem;
    }
    .title {
        color: aliceblue;
        text-align: center;
        text-shadow: 2px 2px 4px #000000;
    }
    .title.simple {
        display: none;
        font-size: 4vw;
    }

    .text-shadow {
        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
    }

    @media (max-width: 600px) {
        .title:not(.simple) {
            display: none;
        }

        .title.simple {
            display: block;
        }
    }
</style>