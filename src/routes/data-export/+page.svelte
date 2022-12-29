<script context="module">
    import Button, { Label, Icon } from "@smui/button";
    import Checkbox from '@smui/checkbox';
    import FormField from '@smui/form-field';
    import MiniProjectTitle from "$lib/Project/MiniProjectTitle.svelte";
    import CharacterButton from "$lib/Character/Button.svelte";
    import ItemButton from "$lib/Item/Button.svelte";
    import { onMount } from "svelte";
    import { constants, user } from "$lib/api/api";
    user.init();
</script>

<svelte:head>
	<title>priconne-quest-helper | Data Export</title>
	<meta name="title" content="priconne-quest-helper | Data Export" />
    <meta name="description" content="priconne-quest-helper Data Exporting - Transfer data between devices!" />
    <meta property="og:title" content="priconne-quest-helper | Data Export" />
    <meta property="og:description" content="priconne-quest-helper Data Exporting - Transfer data between devices!" />
    <meta property="og:image" content="https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/static/logo128.png" />
    <meta property="og:url" content="https://spugn.github.io/priconne-quest-helper/data-export/" />
    <meta property="twitter:title" content="priconne-quest-helper | Data Export" />
    <meta property="twitter:description" content="priconne-quest-helper Data Exporting - Transfer data between devices!" />
</svelte:head>
<svelte:window on:message={handleWindowMessage} />

<div class="color-aliceblue text-center text-shadow-md font-bold py-3.5 mb-3 text-white">
    <h1 class="title text-[5vw] sm:text-3xl">Princess Connect! Re:Dive - Quest Helper</h1>
    <h2 class="title text-[4vw] sm:text-2xl tracking-widest">Data Export</h2>
    <h1 class="title simple">priconne-quest-helper &boxv; Data Export</h1>
</div>

<div style="display: none;">
    <iframe id="gist-creator" bind:this={gist_iframe} title="gist-creator"
        src="https://priconne-quest-helper-v3-gists-creator.vercel.app/"></iframe>
</div>

{#if !failed && mounted}
    <section class="flex flex-col gap-1 pb-40 mx-4 justify-center items-center text-black">
        {#if (!start && projs.length > 0) || (start && projs_enabled)}
            <div class="my-4 flex flex-col gap-1 shadow-md bg-white rounded w-full">
                <FormField>
                    <Checkbox value={"projects"} disabled={start} bind:checked={projs_enabled} />
                    <span slot="label">Projects ({projs.length})</span>
                </FormField>
                <div class="flex flex-row justify-start flex-wrap gap-1">
                    {#each projs as p}
                        <MiniProjectTitle thumbnail={p.thumbnail} project_type={p.type} priority={p.priority}
                            priority_level={p.priority_level} project_name={p.project_name}
                            subtitle={p.subtitle} start_rank={p.start_rank} end_rank={p.end_rank} progress={-1}
                        />
                    {/each}
                </div>
            </div>
        {/if}
        {#if (!start && chars.length > 0) || (start && chars_enabled)}
            <div class="my-4 flex flex-col gap-1 shadow-md bg-white rounded w-full">
                <FormField>
                    <Checkbox value={"characters"} disabled={start} bind:checked={chars_enabled} />
                    <span slot="label">Characters ({chars.length})</span>
                </FormField>
                <div class="flex flex-row justify-start flex-wrap gap-1 pb-3 pl-3">
                    {#each chars as c}
                        <CharacterButton id={c.id} rank={c.rank} />
                    {/each}
                </div>
            </div>
        {/if}
        {#if (!start && items.length > 0) || (start && items_enabled)}
            <div class="my-4 flex flex-col gap-1 shadow-md bg-white rounded w-full">
                <FormField>
                    <Checkbox value={"inventory"} disabled={start} bind:checked={items_enabled} />
                    <span slot="label">Inventory ({items.length})</span>
                </FormField>
                <div class="flex flex-row justify-start flex-wrap gap-1 pb-3 pl-3">
                    {#each items as i}
                        <ItemButton id={i.id} amount={i.amount} />
                    {/each}
                </div>
            </div>
        {/if}
        {#if !start || (start && settings_enabled)}
            <div class="my-4 flex flex-col gap-1 shadow-md bg-white rounded w-full">
                <FormField>
                    <Checkbox value={"settings"} disabled={start} bind:checked={settings_enabled} />
                    <span slot="label">Settings</span>
                </FormField>
                <div class="flex flex-row justify-start flex-wrap gap-1 px-3 pb-3">
                    <textarea disabled class="w-full h-auto" rows="10">{JSON.stringify(settings, null, 2)}</textarea>
                </div>
            </div>
        {/if}
        {#if success}
            <div class="flex flex-col gap-1 py-5 justify-center items-center text-white text-shadow">
                <strong class="block text-3xl break-all text-cyan-300 text-center">{url}</strong>
                <small>Visit this link on a different device to import your priconne-quest-helper data.</small>
                <small>URLs older than a month will occasionally be purged.</small>
                <Button variant="raised" class="w-full"
                    on:click={() => copyURLToClipboard()}
                >
                    <Icon class="material-icons">content_copy</Icon>
                    <Label>Copy URL to Clipboard</Label>
                </Button>
            </div>
        {:else}
            <div class="w-full">
                <Button variant="raised" class="w-full"
                    disabled={(!start && (!projs_enabled && !chars_enabled && !items_enabled && !settings_enabled)) || start}
                    on:click={() => generateURL()}
                >
                    <Icon class="material-icons">done</Icon>
                    <Label>Generate URL</Label>
                </Button>
            </div>
        {/if}
    </section>
{:else if failed}
    <div class="flex flex-col justify-center items-center">
        <strong>Failed to export data</strong>
        <small>Refresh the page and try again or try again at a later date.</small>
    </div>
{/if}

<script lang="ts">
    import type { CharacterProject } from "$lib/api/api.d";

    interface ProjectExportData {
        thumbnail: string;
        type: string;
        priority: boolean;
        priority_level: number;
        project_name: string;
        subtitle: string;
        start_rank: number;
        end_rank: number;
    };
    let projs_enabled : boolean = false;
    const projs : ProjectExportData[] = buildProjects();
    function buildProjects() {
        let results : ProjectExportData[] = [];
        for (const key of Object.keys(user.projects.get())) {
            const p = user.projects.get()[key];
            let result : ProjectExportData = {
                thumbnail: p.type === "character" ? (p as CharacterProject).details.avatar_id : Object.keys(p.required)[Object.keys(p.required).length * Math.random() << 0],
                type: p.type || "item",
                priority: p.priority || false,
                priority_level: p.details?.priority_level || 2,
                project_name: p.details?.name || "Untitled Project",
                subtitle: p.type === "character" ? (p as CharacterProject).details.formal_name : "Item Project",
                start_rank: p.type === "character" ? (p as CharacterProject).details.start.rank : -1,
                end_rank: p.type === "character" ? (p as CharacterProject).details.end.rank : -1,
            };
            results.push(result);
        }
        return results;
    }

    interface CharacterExportData {
        id: string;
        rank: number;
    }
    let chars_enabled : boolean = false;
    const chars : CharacterExportData[] = buildCharacters();
    function buildCharacters() {
        let results : CharacterExportData[] = [];
        for (const key in user.character.get()) {
            const c = user.character.getCharacter(key);
            results.push({
                id: key,
                rank: c.rank,
            });
        }
        return results;
    }

    interface InventoryExportData {
        id: string;
        amount: number;
    }
    let items_enabled : boolean = false;
    const items : InventoryExportData[] = buildItems();
    function buildItems() {
        let results : InventoryExportData[] = [];
        for (const key in user.inventory.get()) {
            const i = user.inventory.getAmount(key);
            results.push({
                id: key,
                amount: i,
            });
        }
        return results;
    }

    let settings_enabled : boolean = false;
    const settings = user.settings.get();

    let url : string;
    let receiverWindow : Window;
    const hash = ["b4aj", "zMT2", "ST2S", "dD4f", "9GSV", "Hxjz", "wM2b", "2j1k", "ghp_", "LBF1", "8704351629"];
    let hash_string = "";
    const heroku_url = "https://priconne-quest-helper-v3-gists-creator.vercel.app";
    let gist_iframe : HTMLIFrameElement;
    let start : boolean = false;
    let failed : boolean = false;
    let success : boolean = false;
    let mounted : boolean = false;

    onMount(() => mounted = true);

    // @ts-ignore
    function handleWindowMessage(e) {
        if (~e.origin.indexOf(heroku_url)) {
            hash_string = "";
            console.log(e.data + " from " + heroku_url);

            url += e.data;
            success = true;

            // URL CREATION COMPLETED
            console.log("donezo!", url);
        }
        else {
            console.log("[Export Data] - Received message... but it's from the wrong url: " + e.origin);
        }
    }

    // @ts-ignore
    function sendDataToHeroku(content) {
        try {
            receiverWindow = gist_iframe.contentWindow as Window;
            receiverWindow.postMessage(location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: ''), heroku_url);
            receiverWindow.postMessage(content, heroku_url);
            receiverWindow.postMessage(hash_string, heroku_url);
            receiverWindow.postMessage("priconne_gist", heroku_url);
        }
        catch (err) {
            console.log("error", err);
            failed = true;
        }
    }

    function generateURL() {
        if (start) {
            return;
        }
        start = true;
        // @ts-ignore
        for (const i in hash[hash.length - 1]) {
            hash_string += hash[parseInt(hash[hash.length - 1][i])];
        }
        url = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname.substring(0, window.location.pathname.indexOf('/')) + window.location.pathname.split('/')[1] + "/data-import?id=";

        let content = JSON.stringify({
            ...(items_enabled && { inventory: user.inventory.get() }),
            ...(chars_enabled && { character: user.character.get() }),
            ...(projs_enabled && { projects: user.projects.get() }),
            ...(settings_enabled && { settings: user.settings.get() }),
        });
        console.log("[Data Export] - Content Generated: " + content);
        sendDataToHeroku(content);
    }

    function copyURLToClipboard() {
        navigator.clipboard.writeText(url);
    }
</script>

<style>
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