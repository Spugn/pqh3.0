<svelte:head>
    {#if exists}
        <title>{name.JP} ({id}) | priconne-quest-helper</title>
        <meta name="title" content="{id} | priconne-quest-helper" />
        <meta name="description" content="Item data for {name.JP} ({id})." />
        <meta property="og:title" content="{name.JP} ({id}) | priconne-quest-helper" />
        <meta property="og:description" content="Item data for {name.JP} ({id})." />
        <meta property="og:image" content="https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/static/images/items/{id}.png" />
        <meta property="og:url" content="https://spugn.github.io/priconne-quest-helper/items/{id}" />
        <meta property="twitter:title" content="{name.JP} ({id}) | priconne-quest-helper" />
        <meta property="twitter:description" content="Item data for {name.JP} ({id})." />
    {:else}
        <title>Unknown Item | priconne-quest-helper</title>
        <meta name="title" content="Unknown Item | priconne-quest-helper" />
        <meta name="description" content="Unknown item, invalid item ID provided." />
    {/if}
</svelte:head>

<script context="module">
    import { onMount } from 'svelte';
    import { character, equipment as equipmentAPI, constants, user } from '$lib/api/api';
    import { base } from '$app/paths';
    import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
    import Accordion, { Panel, Header, Content } from '@smui-extra/accordion';
    import SegmentedButton, { Segment, Label } from '@smui/segmented-button';
    import Image from "$lib/Image.svelte";
    import { equipment } from '$lib/api/api';
    import Treant from "$lib/api/vendor/Treant.mjs";
    import "./treant.css"; // treant dependency
</script>

<script lang="ts">
    import type { PageData } from './$types';
    import type { Fragment, Language, Recipe } from '$lib/api/api.d';
    export let data : PageData;
    const waitForFinal = (function () {
        let timers = {};
        // @ts-ignore - old js code idc to figure out types for
        return function (callback, ms, uniqueID) {
            if (!uniqueID) {
                uniqueID = "Don't call this twice without an uniqueID";
            }
            // @ts-ignore - old js code idc to figure out types for
            if (timers[uniqueID]) {
                // @ts-ignore - old js code idc to figure out types for
                clearTimeout(timers[uniqueID]);
            }
            // @ts-ignore - old js code idc to figure out types for
            timers[uniqueID] = setTimeout(callback, ms);
        }
    })();
    let recipe_div : HTMLDivElement;
    let selected : Language = "JP";
    let mounted : boolean = false;
    let first_treant : boolean = true;

    const id : string = data.page;
    const exists : boolean = equipmentAPI.exists(id);
    interface Names {
        [lang : string] : string;
    };
    const name : Names = equipmentAPI.name(id) as Names;

    let fragment : Fragment;
    let still : string;
    let fragment_name : Names;
    let recipe_regions : string[];
    let recipe_total : Recipe = {};
    let character_box : string[] = [];
    let character_usage : { id : string, rank : string, owned : boolean }[] = [];
    let equipment_usage : string[] = [];
    if (exists) {
        fragment = equipment.fragment(id) as Fragment;
        fragment_name = equipmentAPI.fragmentName(id) as Names;
        recipe_regions = Object.keys(equipmentAPI.data[id].recipes);
        character_box = getCharacterBox();
        character_usage = getCharacterUsage();
        equipment_usage = getEquipmentUsage();
    }

    function getRandomStill() : string {
        const stills = [
            "bg_100019", "bg_100621", "bg_101892", "bg_500012", "bg_500021",
            "bg_500030", "bg_500170", "bg_500200", "bg_500210", "bg_500220",
            "bg_500240", "bg_500270", "bg_500370", "bg_500390", "bg_530010",
        ];
        return stills[stills.length * Math.random() << 0];
    }

    function getCharacterUsage() {
        let usage = [];
        for (const unit_id in character.data) {
            const char = character.get(unit_id);
            for (const rank_key in char.equipment) {
                const equips = char.equipment[rank_key];
                for (const item_id of equips) {
                    if (item_id === id) {
                        usage.push({
                            id: unit_id,
                            rank: rank_key.replace("rank_", ""),
                            owned: (character_box.length === 0)
                                || (character_box.length > 0 && character_box.includes(unit_id)),
                        });
                        break;
                    }
                }
            }
        }
        return usage.sort((a, b) => (b.owned ? 1 : 0) - (a.owned ? 1 : 0));
    }

    function getEquipmentUsage() {
        let usage = [];
        for (const item_id in equipmentAPI.data) {
            const item = equipmentAPI.get(item_id);
            for (const comp of item.recipes.JP.required_items) {
                if (comp === id) {
                    usage.push(item_id);
                    break;
                }
            }
        }
        return usage;
    }

    function getCharacterBox() {
        user.init();
        return Object.keys(user.character.get());
    }

    function handleWindowResize() {
        waitForFinal(() => {
            buildTreant(selected);
        }, 500, "treant-resize");
    }

    onMount(() => {
        still = getRandomStill();
        mounted = true;
    });

    $: if (mounted) {
        buildTreant(selected);
    }

    let min_width : number = Number.MAX_VALUE;
    let full_mode : boolean = false;
    function buildTreant(language : Language, prev_config : object | undefined = undefined) {
        function removeAllChildren() {
            recipe_div.classList.remove("Treant", "Treant-loaded");
            while (recipe_div.firstChild) {
                recipe_div.removeChild(recipe_div.firstChild);
            }
        }
        const element_id = recipe_div.id;
        let svg = recipe_div.querySelector("svg");
        if (recipe_div.childNodes.length > 0 && svg) {
            recipe_div.style.height = `${recipe_div.querySelector("svg")?.clientHeight || 500}px`;
            removeAllChildren();
        }
        if (prev_config) {
            Treant.treant(prev_config);
            return prev_config;
        }
        recipe_total = {};
        let config = {
            chart: {
                container: `#${element_id}`,
                rootOrientation: "NORTH",
                connectors: {
                    type: "step",
                    style: {
                        "stroke-width": 3
                    }
                },
            },
            nodeStructure: {
                HTMLclass: "",
                image: `${base}/images/items/${id}.png`,
                children: []
            }
        };
        const item_data = equipmentAPI.get(id);
        const frag_amount = equipmentAPI.recipe(id, language).required_pieces;
        if (frag_amount > 0) {
            config["nodeStructure"]["children"] = [
                // @ts-ignore - ignoring cus cant be bothered to figure out types
                {
                    HTMLclass: "",
                    image: `${base}/images/items/${equipmentAPI.fragmentID(id)}.png`,
                    text: {
                        desc: frag_amount
                    }
                }
            ];
            recipe_total[equipmentAPI.fragmentID(id)] = frag_amount;
        }
        else {
            config["nodeStructure"]["children"] = [];
        }

        // add required item recipes
        const required_items = item_data.recipes[language].required_items;
        for (let i = 0, j = required_items.length ; i < j ; i++) {
            // @ts-ignore - ignoring cus cant be bothered to figure out types
            config["nodeStructure"]["children"].push(getRequiredItem(required_items[i]));
        }
        // @ts-ignore - ignoring the `e` parameter callback type checking
        Treant.treant(config, (e) => {
            // hacky positioning crap
            if (!min_width || min_width > e._R.width) {
                min_width = e._R.width;
            }
            if (recipe_div.parentElement?.clientWidth && (recipe_div.parentElement.clientWidth < min_width)) {
                recipe_div.style.width = `${min_width}px`;
                full_mode = false;
            }
            else {
                recipe_div.style.width = "100%";
                if (!full_mode && !first_treant) {
                    // previously wasn't full mode, need to rebuild to center
                    removeAllChildren();
                    Treant.treant(config);
                }
                full_mode = true;
            }
            if (first_treant) {
                console.log("rebuilding treant to set proper heights");
                first_treant = false;
                buildTreant(language, prev_config);
            }
        });
        return config;

        function getRequiredItem(item_id : string) {
            let obj = {};
            const recipe = equipmentAPI.recipe(item_id, language);
            let amount = recipe.required_pieces;
            // @ts-ignore - ignoring cus can't be bothered to figure out types
            obj["HTMLclass"] = "";
            // @ts-ignore - ignoring cus can't bebothered to figure out types
            obj["image"] = `${base}/images/items/${item_id}.png`;
            if (amount > 0) {
                // @ts-ignore - ignoring cus can't be bothered to figure out types
                obj["children"] = [
                    {
                        image: `${base}/images/items/${equipmentAPI.fragmentID(item_id)}.png`,
                        text: {
                            desc: amount
                        },
                    }
                ];
                recipe_total[equipmentAPI.fragmentID(item_id)] = recipe_total[equipmentAPI.fragmentID(item_id)]
                    ? recipe_total[equipmentAPI.fragmentID(item_id)] + amount : amount;
            }
            else {
                // @ts-ignore - ignoring cus can't be bothered to figure out types
                obj["children"] = [];
            }

            let req = recipe.required_items;
            for (let i = 0, j = req.length ; i < j ; i++) {
                // @ts-ignore - ignoring cus can't be bothered to figure out types
                obj["children"].push(getRequiredItem(req[i]));
            }
            return obj;
        }
    }
</script>

<svelte:window on:resize={handleWindowResize} />

{#if equipmentAPI.exists(data.page)}
    <section>
        <div class="item">
            <div class="header flex flex-col gap-1 items-start">
                <div>
                    <a href="{base}/items" class="flex flex-row justify-center gap-1 back-to-index"
                        style="color: inherit; text-decoration: none;"
                    >
                        <span class="material-icons">arrow_back</span>
                        <span>back to item list</span>
                    </a>
                </div>
                <div class="flex flex-row items-start gap-2">
                    <div class="thumbnail">
                        <img loading="lazy" src={`${base}/images/items/${id}.png`}
                            title={`${id}`}
                            alt={`${id}`}
                        />
                    </div>
                    <div class="header-text">
                        <div class="name">{name.JP}</div>
                        <div class="subtitle">{id}</div>
                    </div>
                </div>
            </div>
            <div class="content-wrapper">
                <div class="content flex flex-col w-full items-center gap-3">
                    <div class="flex flex-col w-[90%] gap-1">
                        <div class="section-title">Equipment Names</div>
                        <DataTable table$aria-label="Equipment Name list" style="max-width: 100%;">
                            <Head>
                                <Row>
                                    <Cell>Language</Cell>
                                    <Cell>Equipment Name</Cell>
                                </Row>
                            </Head>
                            <Body>
                                {#each Object.keys(name) as lang}
                                    <Row>
                                        <Cell>{lang}</Cell>
                                        <Cell>{name[lang]}</Cell>
                                    </Row>
                                {/each}
                            </Body>
                        </DataTable>
                        {#if fragment}
                            <DataTable table$aria-label="Fragment Name list" style="max-width: 100%;">
                                <Head>
                                    <Row>
                                        <Cell>Language</Cell>
                                        <Cell>Fragment Name</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each Object.keys(fragment_name) as lang}
                                        <Row>
                                            <Cell>{lang}</Cell>
                                            <Cell>{fragment_name[lang]}</Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {/if}
                    </div>
                    <div class="flex flex-col w-[90%] gap-1">
                        <div class="flex flex-row flex-wrap items-center gap-3">
                            <div class="section-title">Recipe</div>
                            <SegmentedButton segments={recipe_regions} let:segment singleSelect bind:selected>
                                <Segment {segment}>
                                    <Label>{segment}</Label>
                                </Segment>
                            </SegmentedButton>
                        </div>
                        <div class="w-full bg-white/[0.1] rounded-md overflow-x-auto">
                            <div id="recipe-display" bind:this={recipe_div} />
                        </div>
                        <!-- total recipe count -->
                        <div class="flex flex-row flex-wrap gap-1">
                            {#each Object.keys(recipe_total) as item_id (`${item_id}-${recipe_total[item_id]}`)}
                                <div class="h-12 w-12">
                                    <Image img={item_id} type="items" alt={id} force_png
                                        props={{ width: 48, height: 48 }}
                                    />
                                    <div class="recipe-total-amount font-mono font-bold text-white text-right select-none">
                                        {recipe_total[item_id]}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                    {#if equipment_usage.length > 0}
                        <div class="flex flex-col w-[90%] gap-1">
                            <div class="section-title">Equipment Usage</div>
                            <div class="flex flex-row flex-wrap justify-center items-center gap-1">
                                {#each equipment_usage as usage (usage)}
                                    <a href="{base}/items/{usage}" target="_blank" rel="noreferrer">
                                        <Image img={usage} type="items" alt={usage}
                                            props={{
                                                width: 64,
                                                height: 64,
                                                draggable: false,
                                            }}
                                        />
                                    </a>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    {#if character_usage.length > 0}
                        <div class="flex flex-col w-[90%] gap-1">
                            <div class="section-title">Character Usage</div>
                            <div class="flex flex-row flex-wrap justify-center items-center gap-1">
                                {#each character_usage as usage (JSON.stringify(usage))}
                                    <a href="{base}/characters/{usage.id}">
                                        <Image img={usage.id} type="unit_icon" alt={`${usage.id} - rank ${usage.rank}`}
                                            props={{
                                                width: 64,
                                                height: 64,
                                                draggable: false,
                                                ...(!usage.owned) && { "class": "grayscale opacity-50" },
                                            }}
                                        />
                                        <div class="rank font-bold text-white text-right text-xl select-none">
                                            {usage.rank}
                                        </div>
                                    </a>
                                {/each}
                            </div>
                        </div>
                    {/if}
                    <div class="flex flex-col w-[90%] gap-1">
                        <div class="section-title">Image Assets</div>
                        <Accordion multiple>
                            <Panel>
                                <Header>Equipment Icon</Header>
                                <Content>
                                    <Image img={id} type="items" alt={id} force_png />
                                    {#if fragment && (fragment.id !== id || fragment.id !== constants.placeholder_id)}
                                        <Image img={fragment.id} type="items" alt={fragment.id} force_png />
                                    {/if}
                                </Content>
                            </Panel>
                        </Accordion>
                    </div>
                </div>
            </div>
        </div>
        {#if still}
            <img loading="lazy" src={`${base}/images/unit_still/${still}.png`}
                title={`still ${still}`}
                alt={`still ${still}`}
                class="still"
            />
        {/if}

        <div class="overlay select-none" />
    </section>
{:else}
    <div>
        item id {data.page} does not exist.
    </div>
    <a href="{base}/items">back to item index</a>
{/if}

<style>
    .recipe-total-amount {
        margin-top: -1.75rem;
        margin-right: 0.25rem;

        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
    }
    .recipe-total-amount:before {
        content: '\00D7';
    }
    .rank {
        margin-top: -2rem;
        margin-right: 0.25rem;

        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
        position: relative; /* needed to elevate the rank text above unit icon */
    }
    div.header {
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 2;
    }
    div.thumbnail {
        width: 100px;
        height: 100px;
    }
    div.header-text {
        color: white;
        text-shadow: 2px 2px 4px #000000;
    }
    div.header-text .name {
        font-weight: 700;
        letter-spacing: 0.2px;
        font-size: 24px;
        color: white;
        white-space: nowrap;
        margin-right: 15px;
    }
    div.header-text .subtitle {
        font-weight: 500;
        letter-spacing: 0.2px;
        font-size: 14px;
        color: rgba(240, 240, 240, 1);
    }
    div.content-wrapper {
        position: fixed;
        bottom: 0;
        width: 100vw;
        max-height: 80vh;
        min-height: 70vh;
        height: calc(90vh - (20vw));
        background-image: url("/images/webpage/adv_mask_C.png");
        border-top-left-radius: 1rem;
        border-top-right-radius: 1rem;
        box-shadow: -25px 0px 5px 3px rgba(0,0,0,0.3);
        z-index: 2;
        padding: 1rem;
    }
    div.content {
        max-height: 70vh;
        overflow-y: auto;
        white-space: pre-line;
        padding-bottom: 8vh;
    }
    div.overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        opacity: 1;
        transition: opacity(0.3);
    }
    img.still {
        min-width: 100%;
        height: auto;
        width: auto;
        position: fixed;
        top: 0;
        left: -100%;
        right: -100%;
        margin: auto;
        z-index: 0; /* below overlay */
        transform: scale(1.5);
        filter: blur(0.5vw);
        transition-property: transform, filter;
        transition-duration: 1s;
        transition-timing-function: ease-out;
    }
    .section-title {
        font-weight: 600;
        letter-spacing: 1px;
        font-size: 1rem;
    }
    .back-to-index {
        font-family: "Calibri", Arial, serif;
        color: white;
        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
    }
    @media only screen and (max-width: 1200px) {
        img.still {
            transform: none;
            filter: none;
        }
    }
    @media only screen and (max-width: 300px) {
        img.still {
            transform: scale(3);
            transform-origin: top;
        }
    }
</style>