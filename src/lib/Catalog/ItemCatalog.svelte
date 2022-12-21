<script context="module">
    import Tab from "@smui/tab";
    import TabBar from "@smui/tab-bar";
    import { user, equipment } from "$lib/api/api";
    import ItemAvatarGroup from "$lib/Avatar/ItemAvatarGroup.svelte";
    import ItemButton from "$lib/Item/Button.svelte";
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    export let show_full : boolean = false;
    export let show_fragment : boolean = false;
    let catalog = (show_full && show_fragment) ? equipment.getCatalog().all
        : (show_full) ? equipment.getCatalog().full
        : (show_fragment) ? equipment.getCatalog().fragment
        : equipment.getCatalog().all;
    let tabs = [...[...Array(equipment.getMaxRarity())].map((_v, i) => i + 1), 99];
    let active : number = 1;

    function getAvatars(tab : number) {
        let avatars : string[] = [];
        let pool = Object.keys(catalog[`${tabs[tab - 1]}`]);
        while (avatars.length < 3) {
            const item = pool[pool.length * Math.random() << 0];
            if (!avatars.includes(item)) {
                avatars.push(item);
            }
        }
        return avatars;
    }
</script>

<!-- HTML HERE -->
<div {...$$restProps}>
    <TabBar class="mb-4" tabs={tabs.map((_v, i) => i + 1)} let:tab bind:active>
        <Tab {tab}>
            <ItemAvatarGroup avatars={getAvatars(tab)} />
        </Tab>
    </TabBar>
    <div class="flex flex-wrap flex-row justify-center gap-1 select-none">
        {#each Object.keys(catalog[tabs[active - 1]]) as id (id)}
            {#if !user.settings.hideContent() || (user.settings.hideContent() && equipment.existsInRegion(id, user.region.get()))}
                <ItemButton {id} click={() => dispatch("select_item", { data: { id } })} ignore_amount />
            {/if}
        {/each}
    </div>
</div>

<style>

</style>