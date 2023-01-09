<script context="module">
    import Image from "$lib/Item/Image.svelte";
    import ItemButton from "$lib/Item/Button.svelte";
    import Card, { Content } from '@smui/card'
    import Accordion, { Panel, Header, Content as AccordionContent } from '@smui-extra/accordion';
    import IconButton, { Icon } from '@smui/icon-button';
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    import { user, equipment as equipmentAPI } from '$lib/api/api';
    import type { CharacterProject, ItemProject, ProjectProgressResult, Recipe } from '$lib/api/api.d';
    export let project : CharacterProject | ItemProject;
    export let project_progress : ProjectProgressResult;
    export let is_all_project : boolean = false; // if true, disable partial completion

    // component state variables
    let required_items_open : boolean = false;

    // project info variables
    let required_items : Recipe;

    // project info variables - reactive stuff
    $: {
        required_items = (project as CharacterProject).required || {};
    };

    function getEquipmentName(item_id : string) : string {
        return (equipmentAPI.name(item_id, user.region.get()) as string);
    }
    function openPartialCompletionDialog(item_id : string, max : number) {
        // trigger event to open modal in Project
        dispatch('open_partial_completion_dialog', {
            data: {
                open: true,
                item_id,
                amount: 1,
                max,
                consume: false,
            },
        });
    }
    function openInventoryEditDialog(item_id : string) {
        // trigger event to open modal in Project
        dispatch('open_inventory_edit_dialog', {
            data: {
                open: true,
                item_id,
            },
        });
    }
</script>

<div class="flex gap-4 m-4 flex-wrap">
    <Card class="text-black drop-shadow-lg">
        <Content class="m-auto">
            {#if Object.keys(project.details.ignored_rarities).length > 0}
                <span class="title">Ignored</span>
                <div>
                    {#each Object.entries(project.details.ignored_rarities) as [rarity] (rarity)}
                        {#if project.details.ignored_rarities[rarity]}
                            <Image id={`99${rarity}999`} alt={`rarity-${rarity}`} props={{
                                height: 32,
                                width: 32,
                                class: "pr-1"
                            }} />
                        {/if}
                    {/each}
                </div>
            {:else}
                <span class="title italic">no content</span>
            {/if}
        </Content>
        {#if Object.keys(project.required).length > 0}
            <Accordion class="rounded-3xl">
                <Panel bind:open={required_items_open}>
                    <Header>
                        <span>Project Items</span>
                        <IconButton slot="icon" toggle pressed={required_items_open}>
                            <Icon class="material-icons" on>expand_less</Icon>
                            <Icon class="material-icons">expand_more</Icon>
                        </IconButton>
                    </Header>
                    <AccordionContent>
                        <span class="required-items-entry-amount">
                            {Object.keys(project.required).length}
                            {Object.keys(project.required).length === 1 ? "entry" : "entries"}
                        </span>
                        <table class="w-full">
                            {#each Object.entries(required_items) as [item_id, amount] (`${item_id}-${amount}`)}
                                <tr>
                                    <td class="text-right border-b border-gray-700 py-1 required-items-amount">
                                        <span class="mr-2 whitespace-nowrap">{amount.toLocaleString("en-US")}</span>
                                        <span class="pr-2">&times;</span>
                                    </td>
                                    <td class="border-b border-gray-700 py-1 required-items-item">
                                        <Image id={item_id} props={{
                                            height: 28,
                                            width: 28,
                                            class: "block relative top-1",
                                            style: "border-radius: 2px;",
                                        }} />
                                        <span class="relative bottom-1">{getEquipmentName(item_id)}</span>
                                    </td>
                                </tr>
                            {/each}
                        </table>
                    </AccordionContent>
                </Panel>
            </Accordion>
        {/if}
    </Card>
    <Card class={"text-black drop-shadow-lg grow basis-96 min-h-[300px]"}>
        <span class="title pl-2 pt-1">Required Items</span>
        <Content class="flex flex-wrap gap-1">
            {#each Object.entries(project.required) as [item_id, amount] (`${item_id}-${amount}`)}
                <ItemButton id={item_id} amount={amount}
                    {...(!is_all_project && { click: () => { openPartialCompletionDialog(item_id, amount) } })}
                />
            {/each}
        </Content>
    </Card>
    <Card class="text-black drop-shadow-lg grow basis-96">
        <span class="title pl-2 pt-1">Required Fragments</span>
        <Content class="flex flex-wrap gap-1">
            {#each Object.entries(project_progress.check.recipe) as [item_id, amount] (`${item_id}-${amount}`)}
                <ItemButton id={item_id} {amount}
                    click={() => { openInventoryEditDialog(item_id) }} />
            {/each}
        </Content>
    </Card>
    {#if Object.entries(project_progress.check.remaining).length > 0}
        <Card class="text-black drop-shadow-lg grow basis-96">
            <span class="title pl-2 pt-1">Missing Fragments</span>
            <Content class="flex flex-wrap gap-1">
                {#each Object.entries(project_progress.check.remaining) as [item_id, amount] (`${item_id}-${amount}`)}
                    <ItemButton id={item_id} {amount}
                        click={() => { openInventoryEditDialog(item_id) }} />
                {/each}
            </Content>
        </Card>
    {/if}
</div>

<style>
    .title {
        /** titles for cards, not the top title */
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
    .required-items-entry-amount {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
    .required-items-amount :nth-child(1) {
        /** item quantity */
        font-weight: 500;
        color: black;
        font-size: 16px;
    }
    .required-items-amount :nth-child(2) {
        /** times symbol */
        font-weight: 600;
    }
    .required-items-item span {
        /** equipment full name */
        font-weight: 600;
        letter-spacing: 0.2px;
        color: black;
        font-size: 14px;
    }
</style>