<script context="module">
    import Button, { Label, Icon } from "@smui/button";
    import MiniProjectTitle from "$lib/Project/MiniProjectTitle.svelte";
    import CharacterButton from "$lib/Character/Button.svelte";
    import ItemButton from "$lib/Item/Button.svelte";
    import { onMount } from "svelte";
    import { base } from '$app/paths';
</script>

<script lang="ts">
    import type { CharacterProject } from "$lib/api/api.d";
    import { user } from "$lib/api/api";
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
        let response;

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
        if (import_data.character) {
            // @ts-ignore
            user.character.set(import_data.character);
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
                <a href="{base}/" class="flex flex-row justify-center items-center mt-4 gap-2"
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