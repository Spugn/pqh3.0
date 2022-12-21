<script context="module">
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import Button, { Label } from "@smui/button";
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    import { user } from '$lib/api/api';
    import EditCharacterProject from "./EditCharacterProject.svelte";
    import type { CharacterProject, ItemProject } from '$lib/api/api.d';
    import EditItemProject from "./EditItemProject.svelte";

    export let open : boolean = false;
    export let project_id : number;

    let show_item_catalog = false;

    let project : CharacterProject | ItemProject;
    let character_project : CharacterProject;
    let item_project : ItemProject;

    $: if (open) { // crappy workaround for the scrollbar lock
        project = (user.projects.get()[project_id] as CharacterProject | ItemProject);
        if (project.type === "character") {
            character_project = (project as CharacterProject);
        }
        if (project.type === "item") {
            item_project = (project as ItemProject);
        }
    }
    $: if (!open && show_item_catalog) { // reset show_item_catalog
        show_item_catalog = false;
    }
</script>

<Dialog bind:open={open} class="text-black z-[1001]"
    {...((show_item_catalog) && { surface$style: "min-width: calc(100vw - 64px); min-height: calc(100vh - 32px);" })}
>
    <!-- z-index needs to be above miyako menu button (z-index 1000) -->
    {#if open} <!-- crappy workaround for the scrollbar lock -->
        {#if project.type === "character"}
            <div class="title pl-2 pt-1">Edit Character Project Details</div>
            <DialogContent class="text-center">
                <EditCharacterProject id={character_project.details.avatar_id} project={character_project}
                    on:generated_project={(event) => {
                        const proj = event.detail.data.project;
                        dispatch("success", {
                            data: {
                                project_id: proj.date,
                                project: proj,
                            },
                        });
                        open = false;
                    }}
                />
            </DialogContent>
            <Actions>
                <Button color="secondary" variant="outlined" class="w-full"
                    on:click={() => {
                        open = false;
                    }}
                >
                    <Label>Cancel</Label>
                </Button>
            </Actions>
        {/if}
        {#if project.type === "item"}
            <div class="title pl-2 pt-1">Edit Item Project Details</div>
            <DialogContent class="text-center">
                <EditItemProject project={item_project}
                    bind:show_catalog={show_item_catalog}
                    on:generated_project={(event) => {
                        const proj = event.detail.data.project;
                        dispatch("success", {
                            data: {
                                project_id: proj.date,
                                project: proj,
                            },
                        });
                        open = false;
                    }}
                />
            </DialogContent>
            <Actions>
                {#if !show_item_catalog}
                    <Button color="secondary" variant="outlined" class="w-full"
                        on:click={() => {
                            open = false;
                        }}
                    >
                        <Label>Cancel</Label>
                    </Button>
                {/if}
            </Actions>
        {/if}
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