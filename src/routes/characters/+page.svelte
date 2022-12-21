<script context="module">
    import { base } from '$app/paths';
    import { character as characterAPI } from '$lib/api/api';
    import Image from "$lib/Image.svelte";
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import TextfieldIcon from '@smui/textfield/icon';
</script>

<script lang="ts">
    let characters : string[] = [];
    let search_query = ""; // text input for what to search for
    let filter : string[] = []; // search results

    function updateCharacters() {
        characters = [];
        Object.entries(characterAPI.data)
            .filter(([id]) => search_query === "" || filter.includes(id))
            .forEach(([id]) => {
                characters.push(id);
            });
    }

    $: {
        filter = characterAPI.search(search_query);
        updateCharacters();
    }
</script>

<svelte:head>
	<title>Princess Connect! Re:Dive - Quest Helper | Character Data</title>
	<meta name="title" content="Princess Connect! Re:Dive - Quest Helper | Character Data" />
    <meta name="description" content="Character data used in priconne-quest-helper, a tool for that provides quest choosing assistance and project management for the game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
    <meta property="og:title" content="Princess Connect! Re:Dive - Quest Helper | Character Data" />
    <meta property="og:description" content="Character data used in priconne-quest-helper, a tool for that provides quest choosing assistance and project management for the game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
    <meta property="og:image" content="https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/static/logo128.png" />
    <meta property="og:url" content="https://spugn.github.io/priconne-quest-helper/characters/" />
    <meta property="twitter:title" content="Princess Connect! Re:Dive - Quest Helper | Character Data" />
    <meta property="twitter:description" content="Character data used in priconne-quest-helper, a tool for that provides quest choosing assistance and project management for the game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
</svelte:head>

<div class="color-aliceblue text-center text-shadow-md font-bold py-3.5 mb-3 text-white">
    <h1 class="title text-[5vw] sm:text-3xl">Princess Connect! Re:Dive - Quest Helper</h1>
    <h2 class="title text-[4vw] sm:text-2xl tracking-widest">Character Data</h2>
    <h1 class="title simple">priconne-quest-helper &boxv; Character Data</h1>
</div>

<div class="flex flex-col gap-4">
    <div class="bg-white rounded-md mx-6 p-3">
        <Textfield bind:value={search_query} label="Search" class="w-full">
            <TextfieldIcon class="material-icons" slot="leadingIcon">search</TextfieldIcon>
            <HelperText slot="helper">Search for a character name or ID.</HelperText>
        </Textfield>
    </div>
    <!-- character grid -->
    <div class="flex flex-row gap-1 flex-wrap justify-center items-center pb-8 mx-2">
        {#each characters as id (id)}
            <a href="{base}/characters/{id}">
                <Image img={id} type="unit_icon" alt={`${id}`}
                    props={{
                        draggable: false,
                        height: 96,
                        width: 96,
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