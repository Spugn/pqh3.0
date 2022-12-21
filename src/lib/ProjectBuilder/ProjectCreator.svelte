<script context="module">
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import Button, { Label, Icon } from "@smui/button";
    import LinearProgress from '@smui/linear-progress';
    import { createEventDispatcher } from 'svelte';
    import ItemButton from "$lib/Item/Button.svelte";
    import CharacterCatalog from "$lib/Catalog/CharacterCatalog.svelte";
    import { user } from '$lib/api/api';
    import EditCharacterProject from "./EditCharacterProject.svelte";
    import ItemCatalog from "$lib/Catalog/ItemCatalog.svelte";
    import EditItemProject from "./EditItemProject.svelte";
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    import type { Recipe } from '$lib/api/api.d';

    export let open : boolean = false;
    let edit_character_project : EditCharacterProject;
    let edit_item_project : EditItemProject;
    let step = 0;

    // project variables
    let type : "character" | "item" | undefined;
    let id : string; // character or item id
    let item_project_required : Recipe = {};
    let item_project_required_length : number = 0;

    interface CatalogSelectEvent {
        detail: {
            data: {
                id : string;
            };
        };
    };
    function handleCharacterCatalogSelect(event : CatalogSelectEvent) {
        id = event.detail.data.id;
        step++;
    }
    function handleItemCatalogSelect(event : CatalogSelectEvent) {
        item_project_required = {
            ...item_project_required,
            [event.detail.data.id]: item_project_required[event.detail.data.id]
                ? item_project_required[event.detail.data.id] + 1 : 1,
        }
    }

    $: if (!open) { step = 0; }
    $: item_project_required_length = Object.keys(item_project_required).length;
</script>

<Dialog bind:open={open} class="text-black z-[1001]"
    {...((step === 1) && { surface$style: "min-width: calc(100vw - 64px); min-height: calc(100vh - 32px);" })}
>
    <!-- z-index needs to be above miyako menu button (z-index 1000) -->
    <LinearProgress progress={step / 2} closed={false} />
    {#if step === 0}
        <div class="title pl-2 pt-1">Create Project</div>
        <DialogContent>
            <Button variant="raised" class="w-full h-[15vh] mb-2" style="background-color:#ED6C02"
                on:click={() => {
                    step++;
                    type = "character";
                }}
            >
                <Label>Character</Label>
            </Button>
            <Button variant="raised" class="w-full h-[15vh]" style="background-color:#9C27B0"
                on:click={() => {
                    item_project_required = {};
                    step++;
                    type = "item";
                }}
            >
                <Label>Item</Label>
            </Button>
        </DialogContent>
        <Actions>
            <Button color="secondary" variant="outlined" class="w-full">
                <Label>Cancel</Label>
            </Button>
        </Actions>
    {/if}
    {#if step === 1 && type === "character"}
        <div class="title pl-2 pt-1">Create Character Project</div>
        <DialogContent class="text-center">
            <CharacterCatalog on:select_character={handleCharacterCatalogSelect} />
        </DialogContent>
        <Actions>
            <Button color="secondary" variant="outlined" class="w-full"
                on:click={() => {
                    step = 0;
                }}
            >
                <Label>Change Project Type</Label>
            </Button>
        </Actions>
    {/if}
    {#if step === 1 && type === "item"}
        <div class="title pl-2 pt-1">Create Item Project</div>
        <DialogContent class="text-center flex flex-col">
            <div class="flex flex-row flex-wrap select-none gap-1 justify-center items-center p-4 rounded-md mb-3 bg-[rgba(0,0,0,0.1)]">
                {#if item_project_required_length > 0}
                    {#each Object.keys(item_project_required) as item_id (`${item_id}-${item_project_required[item_id]}`)}
                        <ItemButton id={item_id} amount={item_project_required[item_id]}
                            click={() => {
                                item_project_required = {
                                    ...item_project_required,
                                    [item_id]: item_project_required[item_id] - 1,
                                };
                                if (item_project_required[item_id] <= 0) {
                                    delete item_project_required[item_id];
                                }
                            }}
                        />
                    {/each}
                {:else}
                    <div class="flex flex-col items-center justify-center gap-2">
                        <strong>No items selected</strong>
                        <small>Get started by choosing items below.</small>
                    </div>
                {/if}
            </div>
            {#if item_project_required_length > 0}
                <div class="flex flex-row select-none gap-1 justify-start items-center mb-3 text-[#014361]">
                    <span class="material-icons">info</span>
                    <small>Click on an item above to remove one copy.</small>
                </div>
            {/if}
            <ItemCatalog show_full on:select_item={handleItemCatalogSelect} />
        </DialogContent>
        <Actions class="flex flex-row gap-1 w-full">
            <Button color="secondary" variant="outlined" class="flex-1"
                on:click={() => {
                    step = 0;
                }}
            >
                <Label>Change Project Type</Label>
            </Button>
            <Button color="primary" variant="raised" class="flex-1"
                disabled={item_project_required_length <= 0}
                on:click={() => {
                    step = 2;
                }}
            >
                <Label>Next</Label>
            </Button>
        </Actions>
    {/if}
    {#if step === 2 && type === "character"}
        <div class="title pl-2 pt-1">Edit Character Project Details</div>
        <DialogContent class="text-center">
            <EditCharacterProject bind:this={edit_character_project} {id} on:generated_project={(event) => {
                user.projects.add(event.detail.data.project);
                dispatch("success");
                open = false;
            }} />
        </DialogContent>
        <Actions class="flex flex-row gap-1 w-full">
            <Button color="secondary" variant="outlined" class="flex-1"
                on:click={() => {
                    step = 1;
                }}
            >
                <Label>Back</Label>
            </Button>
            <!-- blank action needed so button won't close dialog (closes by default) -->
            <Button color="primary" variant="raised" class="flex-1" action=""
                on:click={() => {
                    edit_character_project.complete();
                }}
            >
                <Label>Create Project</Label>
            </Button>
        </Actions>
    {/if}
    {#if step === 2 && type === "item"}
        <div class="title pl-2 pt-1">Edit Item Project Details</div>
        <DialogContent class="text-center">
            <EditItemProject items={item_project_required}
                bind:this={edit_item_project}
                on:generated_project={(event) => {
                    user.projects.add(event.detail.data.project);
                    dispatch("success");
                    open = false;
                }}
            />
        </DialogContent>
        <Actions class="flex flex-row gap-1 w-full">
            <Button color="secondary" variant="outlined" class="flex-1"
                on:click={() => {
                    step = 1;
                }}
            >
                <Label>Back</Label>
            </Button>
            <!-- blank action needed so button won't close dialog (closes by default) -->
            <Button color="primary" variant="raised" class="flex-1" action=""
                on:click={() => {
                    edit_item_project.complete();
                }}
            >
                <Label>Create Project</Label>
            </Button>
        </Actions>
    {/if}
</Dialog>

<style>
    .title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
</style>