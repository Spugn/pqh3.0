<script context="module">
    import Image from "$lib/Image.svelte";
    import SegmentedButton, { Segment, Label } from '@smui/segmented-button';
</script>

<script lang="ts">
    import { character, constants, equipment, quest, recipe as recipeAPI } from "$lib/api/api";
    import type { IgnoredRarities, Language, Recipe } from "$lib/api/api.d";
    let ignored_rarities : IgnoredRarities = {};
    const rarity_options : number[] = Array(equipment.getMaxRarity());
    const region_options : string[] = Object.keys(quest.name("1-1") as object); // currently disabled region select
    let selected : Language = "JP";
    let selected_type : "equipment" | "fragments" = "equipment";
    let compiled_equips : Recipe = {};
    let compiled_frags : Recipe = {};
    let equips_sorted : (string | number)[][] = [];
    let frags_sorted : (string | number)[][] = [];
    let character_count : number = 0;

    function buildData(selected : Language, ignored_rarities : IgnoredRarities) {
        console.log("build", selected, ignored_rarities);
        compiled_equips = {};
        compiled_frags = {};
        equips_sorted = [];
        frags_sorted = [];
        character_count = 0;
        compileEquipment();
        compileFragments();
        sort();
    }

    $: buildData(selected, ignored_rarities);

    function compileEquipment() {
        for (const unit_id in character.data) {
            if (!character.existsInRegion(unit_id, selected)) {
                continue;
            }
            character_count++;
            for (let i = 1, j = character.getMaxRank() ; i <= j ; i++) {
                const rank_items = character.equipment(unit_id, i) as string[];
                for (let k = 0, l = rank_items.length ; k < l ; k++) {
                    const item_id = rank_items[k];
                    if (item_id === constants.placeholder_id || !equipment.existsInRegion(item_id, selected)) {
                        continue;
                    }
                    compiled_equips[item_id] = (compiled_equips[item_id] || 0) + 1;
                }
            }
        }
    }
    function compileFragments() {
        for (const item_id in compiled_equips) {
            const recipe : Recipe = recipeAPI.build(item_id, compiled_equips[item_id], selected, ignored_rarities);
            for (const comp in recipe) {
                compiled_frags[comp] = (compiled_frags[comp] || 0) + recipe[comp];
            }
        }
    }
    function sort() {
        equips_sorted = Object.keys(compiled_equips)
            .filter((i) => !ignored_rarities[equipment.getRarityFromID(i)])
            .map(i => [i, compiled_equips[i]])
            // @ts-ignore - ignoring cus idc to fix it lol
            .sort((a, b) => b[1] - a[1]);
        frags_sorted = Object.keys(compiled_frags)
            .filter((i) => !ignored_rarities[equipment.getRarityFromID(i)])
            .map(i => [i, compiled_frags[i]])
            // @ts-ignore - ignoring cus idc to fix it lol
            .sort((a, b) => b[1] - a[1]);
    }
</script>

<svelte:head>
	<title>Princess Connect! Re:Dive - Quest Helper | Statistics</title>
	<meta name="title" content="Princess Connect! Re:Dive - Quest Helper | Statistics" />
    <meta name="description" content="Equipment usage statistics for 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）, based on the data used in priconne-quest-helper." />
    <meta property="og:title" content="Princess Connect! Re:Dive - Quest Helper | Statistics" />
    <meta property="og:description" content="Equipment usage statistics for 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）, based on the data used in priconne-quest-helper." />
    <meta property="og:image" content="https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/static/logo128.png" />
    <meta property="og:url" content="https://spugn.github.io/priconne-quest-helper/statistics/" />
    <meta property="twitter:title" content="Princess Connect! Re:Dive - Quest Helper | Statistics" />
    <meta property="twitter:description" content="Equipment usage statistics for 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）, based on the data used in priconne-quest-helper." />
</svelte:head>

<div class="color-aliceblue text-center text-shadow-md font-bold py-3.5 mb-3 text-white">
    <h1 class="title text-[5vw] sm:text-3xl">Princess Connect! Re:Dive - Quest Helper</h1>
    <h2 class="title text-[4vw] sm:text-2xl tracking-widest">Statistics</h2>
    <h1 class="title simple">priconne-quest-helper &boxv; Statistics</h1>
</div>

<div class="info bg-black/[0.5] w-full">
    <div class="float-right relative bottom-0 right-2 py-1">
        Data from <span class="text-green-500">{character_count}</span> characters
        (Rank 1 to Rank {character.getMaxRank()} | {selected})
    </div>
</div>

<section class="pb-10">
    <!-- options -->
    <div class="flex flex-col gap-2 mb-4">
        <div class="flex flex-row justify-center items-center gap-2">
            {#each rarity_options as _, i}
                <button on:click={() => {
                    const rarity = i + 1;
                        ignored_rarities[rarity] = !ignored_rarities[rarity];
                    }}
                    class={"transition-all h-12 w-12"
                        + (ignored_rarities[i + 1] ? " hover:grayscale-0 grayscale opacity-50 hover:opacity-80" : "")}
                >
                    <Image
                        img={`99${i + 1}999`}
                        type="items"
                        alt={`ignore rarity ${i + 1}`}
                        props={{
                            draggable: false,
                        }}
                    />
                </button>
            {/each}
        </div>
        <!-- CURRENTLY DISABLED THE REGION SELECTION OPTIONS!!!
            - reason is cus i realized there was a fatal issue with the way data is organized now
            - it's impossible to tell whats the max rank for a specific region
        <div class="flex justify-center items-center">
            <SegmentedButton segments={region_options} let:segment singleSelect bind:selected>
                <Segment {segment}>
                    <Label>{segment}</Label>
                </Segment>
            </SegmentedButton>
        </div>
        -->
        <div class="flex justify-center items-center">
            <SegmentedButton segments={["equipment", "fragments"]} let:segment singleSelect bind:selected={selected_type}>
                <Segment {segment}>
                    <Label>{segment}</Label>
                </Segment>
            </SegmentedButton>
        </div>
    </div>
    <div class="flex flex-col gap-1 sm:px-10">
        {#if selected_type === "equipment"}
            <div class="flex flex-row flex-wrap gap-5 justify-center items-center">
                {#each equips_sorted.slice(0, 3) as entry (JSON.stringify(entry))}
                    <div class="relative">
                        <Image img={`${entry[0]}`} type="items" alt={`${entry[0]}`}
                            props={{
                                draggable: false,
                                width: 96,
                                height: 96,
                            }}
                        />
                        <span class="amount top">{entry[1]}</span>
                    </div>
                {/each}
            </div>
            <div class="flex flex-row flex-wrap justify-center items-center gap-1">
                {#each equips_sorted.slice(3) as entry (JSON.stringify(entry))}
                    <div class="relative">
                        <Image img={`${entry[0]}`} type="items" alt={`${entry[0]}`}
                            props={{
                                draggable: false,
                                width: 48,
                                height: 48,
                            }}
                        />
                        <span class="amount">{entry[1]}</span>
                    </div>
                {/each}
            </div>
        {/if}
        {#if selected_type === "fragments"}
            <div class="flex flex-row flex-wrap gap-5 justify-center items-center">
                {#each frags_sorted.slice(0, 3) as entry (JSON.stringify(entry))}
                    <div class="relative">
                        <Image img={`${entry[0]}`} type="items" alt={`${entry[0]}`}
                            props={{
                                draggable: false,
                                width: 96,
                                height: 96,
                            }}
                        />
                        <span class="amount top">{entry[1]}</span>
                    </div>
                {/each}
            </div>
            <div class="flex flex-row flex-wrap justify-center items-center gap-1">
                {#each frags_sorted.slice(3) as entry (JSON.stringify(entry))}
                    <div class="relative">
                        <Image img={`${entry[0]}`} type="items" alt={`${entry[0]}`}
                            props={{
                                draggable: false,
                                width: 48,
                                height: 48,
                            }}
                        />
                        <span class="amount">{entry[1]}</span>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</section>

<style>
    .info {
        position: fixed;
        bottom: 0;
        z-index: 10;
        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 4px #000000;
        text-align: right;
        font-weight: bold;
        color: white;
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

    .amount {
        font-family: "Calibri", Arial, serif;
        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 4px #000000;
        text-align: right;
        font-weight: bold;
        color: white;
        position: absolute;
        bottom: 0.2rem;
        right: 0.2rem;
        font-size: 16px;
    }
    .amount:before {
       content: '\00D7';
    }
    .amount.top {
        bottom: 0.3rem;
        right: 0.3rem;
        font-size: 24px;
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