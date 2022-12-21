<script context="module">
    import Image from "$lib/Image.svelte";
    import ItemImage from "$lib/Item/Image.svelte";
    import Button, { Label, Icon } from "@smui/button";
    import IconButton from "@smui/icon-button";
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import Checkbox from '@smui/checkbox';
    import FormField from '@smui/form-field';
    import { fade, fly } from "svelte/transition";
    import { base } from '$app/paths';
    import CharacterContent from "./CharacterContent.svelte";
    import ItemContent from "./ItemContent.svelte";
    import { constants, project as projectAPI, user, inventory as inventoryAPI } from '$lib/api/api';
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    interface DialogOpenEvent {
        detail: {
            data : PartialCompleteDialogData;
        };
    };
    interface PartialCompleteDialogData {
        open : boolean; // dialog visible or not
        item_id : string; // item id to partial complete
        amount : number; // amount to partially complete
        max : number; // max number to partially complete (amount that project needs)
        consume : boolean; // consume items from inventory?
    };
    interface InventoryEditDialogData {
        open: boolean; // dialog visible or not
        item_id : string; // item id to modify in inventory
        amount : number; // amount in inventory
    }
    import type { CharacterProject, Inventory, ItemProject, ProjectProgressResult } from '$lib/api/api.d';
    export let show_menu : boolean;
    export let project_displayed : boolean;
    export let project_id : string;
    let project : CharacterProject | ItemProject;
    //export let update_inventory : boolean;
    //export let inventory : Inventory;
    export let _inventory_string : string; // used to know when inventory updates (sending obj here causes way too many updates)
    let expanded : boolean = false;
    const dispatch = createEventDispatcher();

    // variables for component text
    let thumbnail : string;
    let date : string;
    let project_name : string;
    let subtitle : string;
    let start_rank : number;
    let end_rank : number;
    let still : string;
    let project_progress : ProjectProgressResult;
    let item_progress : string;
    let fragment_progress : string;
    let partial_complete_dialog : PartialCompleteDialogData = {
        open: false,
        item_id: "999999",
        amount: 0,
        max: 0,
        consume: false,
    };
    let inventory_edit_dialog : InventoryEditDialogData = {
        open: false,
        item_id: "999999",
        amount: 0,
    };

    // reactive stuff


    function updateProject() {
        project = (user.projects.get()[project_id] as CharacterProject | ItemProject);
        thumbnail = ((project as CharacterProject).details.avatar_id) // character project
            || Object.keys(project.required)[Object.keys(project.required).length * Math.random() << 0] // item project
            || constants.placeholder_id; // has no required item for some reason
        date = new Date(project.date).toLocaleDateString();
        project_name = project.details.name || "Untitled Project";
        subtitle = ((project as CharacterProject).details.formal_name) || "Item Project";
        start_rank = ((project as CharacterProject).details.start?.rank) || -1;
        end_rank = ((project as CharacterProject).details.end?.rank) || -1;
        still = ((project as CharacterProject).details.avatar_id) || getRandomStill();
    }
    function updateInventory() {
        project_progress = projectAPI.progress(project, user.inventory.get(), user.region.get(), project.details.ignored_rarities);
        item_progress = `${project_progress.items.current} / ${project_progress.items.max} item${project_progress.items.max > 1 ? "s" : ""}`;
        fragment_progress = `${project_progress.fragments.current} / ${project_progress.fragments.max} fragment${project_progress.fragments.max > 1 ? "s" : ""}`;
    }
    $: {
        console.log("change in project", project_id);
        updateProject();
    };
    $: {
        console.log("change in inventory", project_id, _inventory_string);
        updateInventory();
    };

    function expand(value : boolean = false) {
        expanded = project_displayed = value;
        //expanded = value;
        show_menu = !value;
        if (expanded) {
            document.body.style.overflow = "hidden";
        }
        else {
            setTimeout(() => {
                document.body.style.overflow = "";
            }, 100);
        }
    }

    function getRandomStill() : string {
        const stills = [
            "bg_100019", "bg_100621", "bg_101892", "bg_500012", "bg_500021",
            "bg_500030", "bg_500170", "bg_500200", "bg_500210", "bg_500220",
            "bg_500240", "bg_500270", "bg_500370", "bg_500390", "bg_530010",
        ];
        return stills[stills.length * Math.random() << 0];
    }

    function openPartialCompletionDialog(event : DialogOpenEvent) {
        partial_complete_dialog = event.detail.data;
    }
    function completePartialCompletion() {
        // when user clicks OK button...
        partial_complete_dialog.open = false;
        if (partial_complete_dialog.amount <= 0) {
            return;
        }
        if (partial_complete_dialog.amount > partial_complete_dialog.max) {
            partial_complete_dialog.amount = partial_complete_dialog.max;
        }
        project.required[partial_complete_dialog.item_id] -= partial_complete_dialog.amount;
        if (project.required[partial_complete_dialog.item_id] <= 0) {
            delete project.required[partial_complete_dialog.item_id];
        }
        project.partially_completed = true;
        if (partial_complete_dialog.consume) {
            dispatch('update_inventory', {
                data: {
                    inventory: inventoryAPI.remove(user.inventory.get(), partial_complete_dialog.item_id, partial_complete_dialog.amount),
                },
            });
        }
        else {
            // trigger update, dispatch in other condition will be calling this as well
            updateInventory();
        }
    }
    // @ts-ignore - ignoring because event is a CustomEvent and it doesn't have charCode
    function keypressPartialCompletion(event) {
        if (event.charCode === 13) { // on ENTER key press
            completePartialCompletion();
        }
    }

    function openInventoryEditDialog(event : DialogOpenEvent) {
        inventory_edit_dialog = {
            ...event.detail.data,
            amount: inventoryAPI.get(user.inventory.get(), event.detail.data.item_id),
        };
    }
    function onchangeInventoryEdit() {
        // don't edit inventory here because then all projects will be checked again
        // and it may be stupidly inefficient
        if (inventory_edit_dialog.amount <= 0) {
            inventory_edit_dialog.amount = 0;
            return;
        }
        if (inventory_edit_dialog.amount > constants.inventory.max.fragment) {
            inventory_edit_dialog.amount = constants.inventory.max.fragment;
        }
    }
    // @ts-ignore - ignoring because event is a CustomEvent and it doesn't have charCode
    function keypressInventoryEdit(event) {
        if (event.charCode === 13) { // on ENTER key press
            completeInventoryEdit();
        }
    }
    function completeInventoryEdit() {
        inventory_edit_dialog.open = false;
        if (inventory_edit_dialog.amount <= 0) {
            dispatch('update_inventory', {
                data: {
                    inventory: inventoryAPI.remove(user.inventory.get(), inventory_edit_dialog.item_id),
                },
            });
            return;
        }
        dispatch('update_inventory', {
            data: {
                inventory: inventoryAPI.set(user.inventory.get(), inventory_edit_dialog.item_id, inventory_edit_dialog.amount),
            },
        });
    }
</script>

<!-- if a different project is expanded then hide this one (because components outside of page would overflow) -->
{#if project && ((project_displayed && expanded) || !project_displayed) }
    <div class="project-item" class:expanded={expanded}>
        <div class="project-thumbnail" on:click={() => expand(!expanded)} on:keyup on:keydown on:keypress>
            {#if project.type === "character"}
                <Image img={thumbnail} type="unit_icon" props={{draggable: false}} />
            {/if}
            {#if project.type === "item"}
                <Image img={thumbnail} type="items" props={{draggable: false}} />
            {/if}
            {thumbnail}
        </div>
        <div class="project-details">
            {#if !expanded}
                <div class={"short-detail" + (project.priority ? " bg-gradient-to-r from-white to-yellow-200" : " bg-white")}>
                    <div class="detail-content">
                        <div class="date">{date}</div>
                        <div class="project-text">
                            <div class="project-name">
                                {#if project.priority}
                                    <span style="color: rgb(237, 108, 2);" class="material-icons relative top-[6px]">star</span>
                                {/if}
                                <span class="name">{project_name}</span>
                            </div>
                            <div class="subtitle">{subtitle}</div>
                            <div class={"start-end" + (project.type !== "character" ? " opacity-0 select-none" : "")}>
                                Rank {start_rank}
                                <span class="material-icons w-6 relative top-[6px]">arrow_right_alt_icon</span>
                                Rank {end_rank}
                            </div>
                        </div>
                        <div class="progress">
                            <div>Completion</div>
                            {project_progress.progress}%
                            {#if project_progress.progress >= 100}
                                <span style="color: rgb(46, 125, 50);" class="material-icons relative top-[6px] w-6">checkmark</span>
                            {/if}
                        </div>
                        <div class="item-count">
                            <div>{item_progress}</div>
                            <div>{fragment_progress}</div>
                        </div>
                    </div>
                    <div class="enable-button">
                        <Button variant="raised">
                            <Icon class="material-icons">check_box_outline_blank</Icon>
                            <Label>Disabled</Label>
                        </Button>
                    </div>
                    <div class="more-options">
                        <IconButton
                            size="mini"
                            class="material-icons"
                            on:click={() => console.log("hello")}
                            title="More options">more_vert</IconButton
                    >
                    </div>
                </div>
            {/if}
            {#if expanded}
                <div class="full-detail" in:fly={{ y:100, duration: 250 }}>
                    <div class="detail-content">
                        <div class="project-text" on:click={() => expand(false)} on:keyup on:keydown on:keypress>
                            <div class="project-name">
                                {#if project.priority}
                                    <span style="color: rgb(237, 108, 2);" class="material-icons relative top-[6px]">star</span>
                                {/if}
                                <span class="name">{project_name}</span>
                            </div>
                            <div class="subtitle">{subtitle}</div>
                            {#if project.type === "character"}
                                <div class="start-end">
                                    Rank {start_rank}
                                    <span class="material-icons w-6 relative top-[6px]">arrow_right_alt_icon</span>
                                    Rank {end_rank}
                                </div>
                            {/if}
                        </div>
                        <div class="progress">
                            <div>Completion</div>
                            {project_progress.progress}%
                            {#if project_progress.progress >= 100}
                                <span style="color: rgb(46, 125, 50);" class="material-icons relative top-[6px] w-6">checkmark</span>
                            {/if}
                        </div>
                        <div class="item-count">
                            <div>{item_progress}</div>
                            <div>{fragment_progress}</div>
                        </div>
                        <div class="content">
                            {#if project.type === "character"}
                                <CharacterContent bind:project bind:project_progress
                                    on:open_partial_completion_dialog={openPartialCompletionDialog}
                                    on:open_inventory_edit_dialog={openInventoryEditDialog}
                                />
                            {/if}
                            {#if project.type === "item"}
                                <ItemContent bind:project bind:project_progress
                                    on:open_partial_completion_dialog={openPartialCompletionDialog}
                                    on:open_inventory_edit_dialog={openInventoryEditDialog}
                                />
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
    {#if expanded}
        <!-- still image (of character or random background) -->
        <img loading="lazy" src={`${base}/images/unit_still/${still}.png`}
            title={`still_${still}`}
            alt={`still ${still}`}
            class="still"
            in:fly={{ y:200, duration: 1000 }} out:fade={{ duration: 100 }}
        />
        <!-- close button-->
        <span style="position: absolute; top:6px; right:14px; z-index:501; pointer: cursor;" transition:fade
            on:click={() => expand(false)} on:keyup on:keydown on:keypress
        >
            {#each ["before", "after"] as type}
                <span class={`bm-cross`.trim()}
                    style={`position:absolute; width:3px; height:14px; transform:${type === 'before'
                        ? 'rotate(45deg)' : 'rotate(-45deg)'}`}
                />
            {/each}
        </span>
        <!-- overlay (plain black background) -->
        <div class="overlay select-none" transition:fade on:click={() => expand(false)} on:keyup on:keydown on:keypress />
    {/if}
    {#if expanded && partial_complete_dialog.open}
        <Dialog bind:open={partial_complete_dialog.open} class="text-black z-[502]">
            <!-- z-index needs to be above project contents/overlay/etc -->
            <ItemImage id={partial_complete_dialog.item_id} props={{
                height: 44,
                width: 44,
                class: "absolute top-1 right-1"
            }} />
            <div class="dialog-title pl-2 pt-1">Partial Completion</div>
            <DialogContent>
                <Textfield bind:value={partial_complete_dialog.amount} label="Amount" class="w-full"
                    on:keypress={keypressPartialCompletion}
                    type="number" input$min="0" input$max={partial_complete_dialog.max}>
                    <HelperText slot="helper">Number of items to remove (max: {partial_complete_dialog.max})</HelperText>
                </Textfield>
                <FormField>
                    <Checkbox bind:checked={partial_complete_dialog.consume} />
                    <span slot="label">Consume Inventory?</span>
                </FormField>
            </DialogContent>
            <Actions>
                <Button color="secondary" variant="outlined">
                    <Label>Cancel</Label>
                </Button>
                <Button on:click={() => completePartialCompletion()} variant="raised">
                    <Label>OK</Label>
                </Button>
            </Actions>
        </Dialog>
    {/if}
    {#if expanded && inventory_edit_dialog.open}
        <Dialog bind:open={inventory_edit_dialog.open} class="text-black z-[502]">
            <!-- z-index needs to be above project contents/overlay/etc -->
            <ItemImage id={inventory_edit_dialog.item_id} props={{
                height: 44,
                width: 44,
                class: "absolute top-1 right-1"
            }} />
            <div class="dialog-title pl-2 pt-1">Edit Inventory</div>
            <DialogContent>
                <Textfield bind:value={inventory_edit_dialog.amount} label="Amount" class="w-full"
                    on:keypress={keypressInventoryEdit}
                    on:change={onchangeInventoryEdit}
                    type="number" input$min="0" input$max={constants.inventory.max.fragment}>
                    <HelperText slot="helper">Amount in inventory</HelperText>
                </Textfield>
            </DialogContent>
            <Actions>
                <Button color="secondary" variant="outlined">
                    <Label>Cancel</Label>
                </Button>
                <Button on:click={() => completeInventoryEdit()} variant="raised">
                    <Label>OK</Label>
                </Button>
            </Actions>
        </Dialog>
    {/if}
{/if}

<style>
    /** entirety of component (besides overlay and still image) */
    div.project-item {
        max-width: 1000px;
        margin: auto; /** center project items in div */
        margin-bottom: 25px;
    }
    div.project-item.expanded {
        /** make project-item "full screen" */
        margin: none;
        margin-top: 30vh;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 70vh;
        max-width: none;
        z-index: 501; /** above overlay */
    }

    /** avatar/thumbnail image on left of project usually */
    div.project-thumbnail {
        position: absolute;
        width: 100px;
        height: 100px;
        overflow: hidden;
        border-radius: 50px;
        transform: scale(0.85);
        box-shadow: 10px 15px 15px -10px rgba(0,0,0,0.4);
        z-index: 1; /** needs to be above project details card */
        transition: all 0.4s ease-in-out;
        cursor: pointer;
    }
    div.project-item.expanded div.project-thumbnail {
        position: fixed;
        top: 10px;
        left: 10px;
        right: 0;
        bottom: 0;
        border-radius: 10px;
        transform: scale(1) translateX(0px);
    }

    /** short-detail only, project creation date */
    div.date {
        position: absolute;
        bottom: 3px;
        left: 3px;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.5px;
        color: rgba(0,0,0,0.5);
    }

    /** short-detail only, use flex to align items easier in the "compact" version of project card */
    div.short-detail div.detail-content {
        display: flex;
        align-items: center;
        column-gap: 2rem;
    }

    /** component that contains project details (name, progress, etc). aka the white-space in short-details */
    div.project-details {
        display: block;
        width: auto;
        top: 0;
        z-index: -1;
        height: 120px;
        transform: translateY(25px);
        color: black;
    }
    div.project-item.expanded div.project-details {
        transform: translateY(0px);
        color: white;
    }
    div.project-details div.short-detail {
        position: absolute;
        left: 0;
        width: 100%;
        padding: 15px 45px;
        padding-left: 115px;
        padding-right: 55px;
        border-radius: 5px;
        box-shadow: 0px 25px 45px -10px rgba(0,0,0,0.5);
    }
    div.project-details div.full-detail {
        position: fixed;
        top: 0;
        width: 100vw;
        height: 100vh;
        background-image: url("/images/webpage/adv_mask_C.png");
        border-top-left-radius: 1rem;
        border-top-right-radius: 1rem;
        box-shadow: -25px 0px 5px 3px rgba(0,0,0,0.3);
    }

    /** includes project name, subtitle and start-end (full detail only, has adjustments for expanded page) */
    div.project-details div.full-detail div.project-text {
        /** move text up to top of page (pointer cursor because it's clickable now) */
        position: fixed;
        top: -29vh;
        left: 125px;
        color: white;
        text-shadow: 2px 2px 4px #000000;
        cursor: pointer;
    }

    /** project name ("Untitled Project" or user provided) */
    div.project-details div.short-detail div.project-text .project-name,
    div.project-details div.full-detail div.project-text .project-name {
        font-weight: 700;
        letter-spacing: 0.2px;
    }
    div.project-details div.short-detail div.project-text .project-name {
        font-size: 19px;
        color: rgba(0,0,0,0.8);
        max-width: 200px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
    div.project-details div.full-detail div.project-text .project-name {
        font-size: 24px;
        color: white;
        white-space: nowrap;
        margin-right: 15px;
    }

    /** either "character_name (######)" or "Item Project" */
    div.project-details div.short-detail div.project-text .subtitle,
    div.project-details div.full-detail div.project-text .subtitle {
        font-weight: 500;
        letter-spacing: 0.2px;
    }
    div.project-details div.short-detail div.project-text .subtitle {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.4);
    }
    div.project-details div.full-detail div.project-text .subtitle {
        font-size: 14px;
        color: rgba(240, 240, 240, 1);
    }

    /** Rank # -> Rank # (character projects only) */
    div.project-details div.short-detail div.project-text .start-end,
    div.project-details div.full-detail div.project-text .start-end {
        letter-spacing: 0.2px;
    }
    div.project-details div.short-detail div.project-text .start-end {
        font-size: 14px;
        font-weight: 500;
        color: rgba(0,0,0,0.7);
    }
    div.project-details div.full-detail div.project-text .start-end {
        font-weight: 500;
        color: white;
    }

    /** "Completion" and items/fragments/total progress count */
    div.project-details div.short-detail .progress,
    div.project-details div.full-detail .progress {
        font-weight: 600;
        letter-spacing: 0.2px;
    }
    div.project-details div.short-detail .progress {
        font-size: 14px;
        color: #000;
    }
    div.project-details div.full-detail .progress {
        font-size: 18px;
        color: white;
        position: absolute;
        top: -40px;
        left: 1vw;
        text-shadow: 2px 2px 4px #000000;
    }

    /** "Completion" text */
    div.project-details div.short-detail .progress div,
    div.project-details div.full-detail .progress div {
        font-weight: 500;
        letter-spacing: 0.2px;
    }
    div.project-details div.short-detail .progress div {
        font-size: 12px;
        color: rgba(0,0,0,0.6);
    }
    div.project-details div.full-detail .progress div {
        display: inline-block;
        font-size: 16px;
    }

    /** "###/### items" and "###/### fragments" text */
    div.project-details div.short-detail .item-count,
    div.project-details div.full-detail .item-count {
        font-size: 14px;
    }
    div.project-details div.short-detail .item-count {
        font-weight: 600;
        letter-spacing: 0.2px;
        color: #000;
    }
    div.project-details div.full-detail .item-count {
        font-weight: 400;
        letter-spacing: 0.5px;
        color: white;
        position: absolute;
        top: -80px;
        left: 1vw;
        text-shadow: 2px 2px 4px #000000;
    }

    /** short-detail only, the "triple dot" button */
    div.project-details div.short-detail .more-options {
        position: absolute;
        display: inline-block;
        right: 2px;
        top: 2px;
        color: rgba(0, 0, 0, 0.3);
    }

    /** the enable/disable project button */
    div.project-item div.project-details div.short-detail div.enable-button {
        position: absolute;
        right: 15px;
        bottom: -13px;
        z-index: 1; /** needs to be above project details */
        text-align: center;
        border-radius: 10px;
    }

    /** black screen that appears when project is expanded */
    div.overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 500;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        opacity: 1;
        transition: opacity(0.3);
        cursor: pointer;
    }

    /** still image that appears in background when project is expanded */
    img.still {
        min-width: 100%;
        height: auto;
        width: auto;
        position: fixed;
        top: 0;
        left: -100%;
        right: -100%;
        margin: auto;
        z-index: 499; /** below overlay */
    }

    /** full-detail only, is the scrollable content area */
    div.full-detail div.detail-content div.content {
        max-height: 70vh;
        overflow-y: auto;
        white-space: pre-line;
    }

    .dialog-title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }

    /** responsive screen design stuff below here === */
    @media only screen and (max-width: 800px) {
        /** hide item-count (screen is starting to make it overflow) */
        div.project-details div.short-detail .item-count {
            display: none;
        }
    }
    @media only screen and (max-width: 600px) {
        /** hide progress (screen is starting to make it overflow) */
        div.project-details div.short-detail .progress {
            display: none;
        }
        /** increase padding-bottom so disabled button doesnt overlap with start-end details */
        div.project-details div.short-detail {
            padding-bottom: 25px;
        }
        /** increase margin bottom so disabled button doesnt cover a project's thumbnail below it */
        div.project-item {
            margin-bottom: 45px;
        }
    }
    @media only screen and (max-width: 425px) and (min-height: 600px) {
        /**
         * dealing with devices with low width but large height (i.e. iPhoneSE, Galaxy Fold)
         * `still` image bottom was visible
         */
        div.project-item.expanded {
            width: 100vw;
            height: 80vh;
            margin-top: 20vh;
        }
        /** move project-text (progress/item count) back to content area */
        div.project-details div.full-detail div.project-text {
            top: -19vh;
        }
        /** reposition progress in content area */
        div.project-details div.full-detail .progress {
            position: relative;
            top: 0px;
            text-shadow: none;
        }
        /** reposition item-count in content area */
        div.project-details div.full-detail .item-count {
            position: relative;
            top: 0px;
        }
        @media only screen and (max-width: 300px) {
            /** dealing with Galaxy Fold's stupidly tiny width by lowering project name width */
            div.project-details div.short-detail div.project-text .project-name {
                max-width: 30vw;
            }
        }
    }
    @media only screen and (min-width: 425px) and (max-height: 650px) {
        /** for screens with stupidly long width but lower height (Nest Hub) */
        /** shift "Completion #%" to right side of page */
        div.project-details div.full-detail .progress {
            text-align: right;
            left: auto;
            right: 1vw;
        }
        /** shift "###/### items" and "###/### fragments" to right side of page */
        div.project-details div.full-detail .item-count {
            text-align: right;
            left: auto;
            right: 1vw;
        }
    }
</style>