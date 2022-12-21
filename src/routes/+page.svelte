<script context="module">
    import { onMount } from "svelte";
    import { constants } from '$lib/api/api';
	import LoadingScreen from '$lib/LoadingScreen.svelte';
    import Menu from '$lib/BurgerMenu/Menu.svelte';
    import Item from '$lib/BurgerMenu/Item.svelte';
	import MainPage from "$lib/Pages/MainPage.svelte";
    import { user } from "$lib/api/api";
    import Title from "$lib/Title/Title.svelte";
    import CharacterPage from '$lib/Pages/CharacterPage.svelte';
    import InventoryPage from '$lib/Pages/InventoryPage.svelte';
    import SettingsPage from '$lib/Pages/SettingsPage.svelte';
</script>

<script lang="ts">
    user.init();

    let init_region = user.region.get(); // used to track initial region setting
	let open = false; // menu open state
    let loading = false; // for loading screen, if false then hide
    let data_read_error = false; // if api fails to load then show error
    let show_menu = false; // hide miyako menu icon/burger menu
    let current_page : string = constants.menu_items.home.id; // current page content that should be displayed

    function setCurrentPage(page : string) {
        current_page = page;
    }
</script>

<svelte:head>
	<title>Princess Connect! Re:Dive - Quest Helper | priconne-quest-helper</title>
	<meta name="title" content="Princess Connect! Re:Dive - Quest Helper | priconne-quest-helper" />
    <meta name="description" content="Quest Choosing Assistance and Project Management for the Game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
    <meta property="og:title" content="Princess Connect! Re:Dive - Quest Helper | priconne-quest-helper" />
    <meta property="og:description" content="Quest Choosing Assistance and Project Management for the Game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
    <meta property="og:image" content="https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/static/logo128.png" />
    <meta property="og:url" content="https://spugn.github.io/priconne-quest-helper/" />
    <meta property="twitter:title" content="Princess Connect! Re:Dive - Quest Helper | priconne-quest-helper" />
    <meta property="twitter:description" content="Quest Choosing Assistance and Project Management for the Game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
</svelte:head>

<LoadingScreen {loading} {data_read_error} bind:show_menu on:refresh_region={() => init_region = user.region.get()} />
{#if init_region !== "UNKNOWN"} <!-- hide all this stuff til region is defined so things can be adjusted properly -->
    <Menu hidden={!show_menu} bind:isOpen={open}>
        <Item page_id={constants.menu_items.home.id} {current_page} bind:open
            handleMenuClick={() => setCurrentPage(constants.menu_items.home.id)}>
            {constants.menu_items.home.text}
        </Item>
        <Item page_id={constants.menu_items.characters.id} {current_page} bind:open
            handleMenuClick={() => setCurrentPage(constants.menu_items.characters.id)}>
            {constants.menu_items.characters.text}
        </Item>
        <Item page_id={constants.menu_items.inventory.id} {current_page} bind:open
            handleMenuClick={() => setCurrentPage(constants.menu_items.inventory.id)}>
            {constants.menu_items.inventory.text}
        </Item>
        <Item page_id={constants.menu_items.settings.id} {current_page} bind:open
            handleMenuClick={() => setCurrentPage(constants.menu_items.settings.id)}>
            {constants.menu_items.settings.text}
        </Item>
    </Menu>

    <Title />
    {#if current_page === constants.menu_items.home.id}
        <MainPage bind:show_menu />
    {/if}
    {#if current_page === constants.menu_items.characters.id}
        <CharacterPage />
    {/if}
    {#if current_page === constants.menu_items.inventory.id}
        <InventoryPage />
    {/if}
    {#if current_page === constants.menu_items.settings.id}
        <SettingsPage />
    {/if}
{/if}

<style>

</style>
