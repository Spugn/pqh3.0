<script context="module">
    import { base } from '$app/paths';
    import { character as characterAPI, constants, equipment as equipmentAPI } from '$lib/api/api';
    import Image from "$lib/Image.svelte";
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import TextfieldIcon from '@smui/textfield/icon';
    import Checkbox from '@smui/checkbox';
    import FormField from '@smui/form-field';
</script>

<script lang="ts">
    let items : string[] = [];
    let search_query = ""; // text input for what to search for
    let filter : string[] = []; // search results
    let rank_selected : string[] = [];
    let rank_equips = new Set();
    const rank_usage : { [rank : string] : string[] } = {};
    buildRankUsage();

    function updateItems() {
        items = [];
        Object.entries(equipmentAPI.data)
            .filter(([id]) =>
                (search_query === "" && rank_selected.length <= 0)
                || (rank_selected.length <= 0 && filter.includes(id))
                || (search_query === "" && rank_equips.has(id))
                || (filter.includes(id) && rank_equips.has(id))
            )
            .forEach(([id]) => {
                items.push(id);
            });
    }

    $: {
        filter = equipmentAPI.search(search_query);
        rank_equips = new Set();
        for (const rank of rank_selected) {
            rank_equips = new Set([...rank_equips, ...rank_usage[rank]]);
        }
        updateItems();
    };

    function buildRankUsage() {
        for (const unit_key in characterAPI.data) {
            for (let i = 1, j = characterAPI.getMaxRank() ; i <= j ; i++) {
                const rank_equips : string[] = characterAPI.equipment(unit_key, i) as string[];
                for (const item_id of rank_equips) {
                    if (item_id === constants.placeholder_id) {
                        continue;
                    }
                    if (!rank_usage[i]) {
                        rank_usage[i] = [];
                    }
                    if (!rank_usage[i].includes(item_id)) {
                        rank_usage[i].push(item_id);
                    }
                }
            }
        }
    }
</script>

<svelte:head>
	<title>Princess Connect! Re:Dive - Quest Helper | Item Data</title>
	<meta name="title" content="Princess Connect! Re:Dive - Quest Helper | Item Data" />
    <meta name="description" content="Item data used in priconne-quest-helper, a tool for that provides quest choosing assistance and project management for the game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
    <meta property="og:title" content="Princess Connect! Re:Dive - Quest Helper | Item Data" />
    <meta property="og:description" content="Item data used in priconne-quest-helper, a tool for that provides quest choosing assistance and project management for the game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
    <meta property="og:image" content="https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/static/logo128.png" />
    <meta property="og:url" content="https://spugn.github.io/priconne-quest-helper/items/" />
    <meta property="twitter:title" content="Princess Connect! Re:Dive - Quest Helper | Item Data" />
    <meta property="twitter:description" content="Item data used in priconne-quest-helper, a tool for that provides quest choosing assistance and project management for the game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
</svelte:head>

<div class="color-aliceblue text-center text-shadow-md font-bold py-3.5 mb-3 text-white">
    <h1 class="title text-[5vw] sm:text-3xl">Princess Connect! Re:Dive - Quest Helper</h1>
    <h2 class="title text-[4vw] sm:text-2xl tracking-widest">Item Data</h2>
    <h1 class="title simple">priconne-quest-helper &boxv; Item Data</h1>
</div>

<div class="flex flex-col gap-4">
    <div class="bg-white rounded-md mx-6 p-3">
        <Textfield bind:value={search_query} label="Search" class="w-full">
            <TextfieldIcon class="material-icons" slot="leadingIcon">search</TextfieldIcon>
            <HelperText slot="helper">Search for an equipment name or ID.</HelperText>
        </Textfield>
        <div class="flex flex-row flex-wrap">
            {#each Object.keys(rank_usage) as rank}
                <div class="basis-1/4">
                    <FormField>
                        <Checkbox bind:group={rank_selected} value={rank} />
                        <span slot="label">Rank {rank}</span>
                    </FormField>
                </div>
            {/each}
        </div>
    </div>
    <!-- equipment grid -->
    <div class="flex flex-row gap-1 flex-wrap justify-center items-center pb-8 mx-2">
        {#each items as id (id)}
            <a href="{base}/items/{id}">
                <Image img={id} type="items" alt={`${id}`}
                    props={{
                        draggable: false,
                        height: 64,
                        width: 64,
                    }}
                />
            </a>
        {/each}
    </div>
</div>


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

    @media (max-width: 600px) {
        .title:not(.simple) {
            display: none;
        }

        .title.simple {
            display: block;
        }
    }
</style>