<script context="module">
    import { equipment, user } from "$lib/api/api";
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import Button, { Label } from "@smui/button";
    import ItemButton from "$lib/Item/Button.svelte";
    import { createEventDispatcher } from 'svelte';
    import MenuSurface from '@smui/menu-surface';
    import ItemCatalog from "$lib/Catalog/ItemCatalog.svelte";
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    import type { ItemProject, Recipe } from "$lib/api/api.d";
    export let items : Recipe = {};
    export let project : ItemProject | undefined = undefined;
    let surface : MenuSurface;
    let project_name : string = "";
    let session_ignored = user.getSessionIgnoredRarities();
    export let show_catalog : boolean = false;

    let error = {
        shown: false,
        message: "",
    };

    if (project) {
        items = {
            ...items,
            ...project.required,
        };
        project_name = project.details.name || "";
        session_ignored = project.details.ignored_rarities;
    }

    function validateProject() {
        generateProject();
        return true;
    }

    function showError(message : string) {
        error = {
            shown: true,
            message,
        };
        surface.setOpen(true);
    }

    function generateProject() {
        if (/^\s*$/.test(project_name)) {
            // if project name is only whitespaces, change it to empty string instead
            // so it doesnt screw up the formatting
            project_name = "";
        }
        const result : ItemProject = {
            type: "item",
            date: (project ? project.date : Date.now()),
            priority: (project ? project.priority : false),
            details: {
                name: project_name,
                ignored_rarities: session_ignored,
            },
            required: buildRequiredItems(),
        };
        if (Object.keys(result.required).length <= 0) {
            showError("Resulting project has no required items.");
            return;
        }

        dispatch("generated_project", {
            data: {
                project_id: result.date,
                project: result,
            },
        });
    }

    function buildRequiredItems() {
        console.table(items);
        return items;
    }

    interface CatalogSelectEvent {
        detail: {
            data: {
                id : string;
            };
        };
    };
    function handleItemCatalogSelect(event : CatalogSelectEvent) {
        items = {
            ...items,
            [event.detail.data.id]: items[event.detail.data.id]
                ? items[event.detail.data.id] + 1 : 1,
        }
    }
</script>

{#if !show_catalog}
    <div class="flex flex-wrap flex-col items-center justify-center gap-4" {...$$restProps}>
        <MenuSurface bind:this={surface} class="bg-[#FDEDED] text-[#5F2120] p-4 opacity-[95%] w-full" anchorCorner="TOP_LEFT">
            <div class="font-bold">Invalid Project Error</div>
            <small>{error.message}</small>
        </MenuSurface>
        <div>
            <Textfield bind:value={project_name} label="Project Name" class="w-full">
                <HelperText slot="helper">Optional</HelperText>
            </Textfield>
        </div>
        <div class="w-full mb-2">
            <hr />
            <div class="flex flex-row flex-wrap select-none gap-1 justify-center items-center p-4 rounded-md mb-3 max-w-[415px] bg-[rgba(0,0,0,0.1)]">
                {#if Object.keys(items).length > 0}
                    {#each Object.keys(items) as item_id (`${item_id}-${items[item_id]}`)}
                        <ItemButton id={item_id} amount={items[item_id]} />
                    {/each}
                {/if}
            </div>
            {#if project}
                <Button on:click={() => show_catalog = true} variant="outlined" class="w-full">
                    <Label>Change Items</Label>
                </Button>
            {/if}
        </div>
        <div class="w-full space-y-3 mb-2">
            <hr />
            <div class="title text-left">Additional Details</div>
            <div class="font-bold">
                <small>IGNORED RARITIES (FOR PROJECT COMPLETION)</small>
            </div>
            <div class="flex flex-row items-center justify-center gap-1 select-none max-w-[415px]">
                {#each Array(equipment.getMaxRarity()) as _, i (`${i}-${session_ignored[i + 1]}`)}
                    <ItemButton id={`99${i + 1}999`} ignore_amount
                        click={() => {
                            session_ignored[i + 1] = !session_ignored[i + 1];
                            if (!session_ignored[i + 1]) {
                                delete session_ignored[i + 1];
                            }
                        }}
                        class={"transition-all h-12 w-12"
                            + (session_ignored[i + 1] ? " hover:grayscale-0 grayscale opacity-50 hover:opacity-80" : "")
                        }
                    />
                {/each}
            </div>
        </div>
        <div class="w-full space-y-3 mb-2">
            <hr />
            <Button on:click={validateProject} variant="raised" class="w-full">
                <Label>{project ? "Edit Project" : "Create Project"}</Label>
            </Button>
        </div>
    </div>
{:else}
    <div class="flex flex-col">
        <div class="flex flex-row flex-wrap select-none gap-1 justify-center items-center p-4 rounded-md mb-3 bg-[rgba(0,0,0,0.1)]">
            {#if Object.keys(items).length > 0}
                {#each Object.keys(items) as item_id (`${item_id}-${items[item_id]}`)}
                    <ItemButton id={item_id} amount={items[item_id]}
                        click={() => {
                            items = {
                                ...items,
                                [item_id]: items[item_id] - 1,
                            };
                            if (items[item_id] <= 0) {
                                delete items[item_id];
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
        {#if Object.keys(items).length > 0}
            <div class="flex flex-row select-none gap-1 justify-start items-center mb-3 text-[#014361]">
                <span class="material-icons">info</span>
                <small>Click on an item above to remove one copy.</small>
            </div>
        {/if}
        <Button on:click={() => show_catalog = false} variant="raised" class="mb-3"
            disabled={Object.keys(items).length <= 0}
        >
            <Label>Finish Changes</Label>
        </Button>
        <ItemCatalog show_full on:select_item={handleItemCatalogSelect} />
    </div>
{/if}

<style>
    .title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
</style>