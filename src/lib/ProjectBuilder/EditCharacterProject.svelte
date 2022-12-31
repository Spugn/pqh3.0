<script context="module">
    import { character, constants, equipment, user } from "$lib/api/api";
    import CharacterAvatar from "$lib/Avatar/CharacterAvatar.svelte";
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import Button, { Label } from "@smui/button";
    import ItemButton from "$lib/Item/Button.svelte";
    import ItemImage from "$lib/Item/Image.svelte";
    import { createEventDispatcher } from 'svelte';
    import MenuSurface from '@smui/menu-surface';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    import type { CharacterProject, Recipe } from "$lib/api/api.d";
    export let id : string;
    export let project : CharacterProject | undefined = undefined;
    let surface : MenuSurface;
    let character_name : string = character.name(id, user.region.get()) as string;
    let project_name : string = "";
    let start_rank : number = 1;
    let start_rank_prev = start_rank; // used as rank history, if new rank is different from this then reset equipped
    let start_equips : string[] = character.equipment(id, start_rank) as string[];
    let start_equipped : [boolean, boolean, boolean, boolean, boolean, boolean]
        = [false, false, false, false, false, false];
    let end_rank : number = 1;
    let end_rank_prev = end_rank; // used as rank history, if new rank is different from this then reset equipped
    let end_equips : string[] = character.equipment(id, end_rank) as string[];
    let end_equipped : [boolean, boolean, boolean, boolean, boolean, boolean]
        = [false, false, false, false, false, false];
    let session_ignored = user.getSessionIgnoredRarities();

    const regular_piece = `3${id.substring(0, 4)}`;
    const pure_piece = `32${id.substring(1, 4)}`;
    const regular_exists = equipment.exists(regular_piece);
    const pure_exists = equipment.exists(pure_piece);
    let regular_count : number = 0;
    let pure_count : number = 0;

    if (project) {
        project_name = project.details.name || "";
        start_rank = start_rank_prev = project.details.start.rank;
        start_equips = character.equipment(id, start_rank) as string[];
        start_equipped = project.details.start.equipment;
        end_rank = end_rank_prev = project.details.end.rank;
        end_equips = character.equipment(id, end_rank) as string[];
        end_equipped = project.details.end.equipment;
        regular_count = project.details.memory_piece || 0;
        pure_count = project.details.pure_memory_piece || 0;
        session_ignored = project.details.ignored_rarities;
    }

    let error = {
        shown: false,
        message: "",
    };

    function onchangeStartRank() {
        if (isNaN(start_rank)) {
            start_rank = 1;
        }
        start_rank = Math.floor(start_rank);
        if (start_rank <= 0) {
            start_rank = 1;
        }
        if (start_rank > character.getMaxRank()) {
            start_rank = character.getMaxRank();
        }
        if (start_rank > end_rank) {
            end_rank = start_rank;
            onchangeEndRank();
        }
        if (start_rank > 0 && start_rank <= character.getMaxRank() && start_rank !== start_rank_prev) {
            start_equips = character.equipment(id, start_rank) as string[];
            start_equipped = [false, false, false, false, false, false];
            start_rank_prev = start_rank;
        }
    }

    function onchangeEndRank() {
        if (isNaN(end_rank)) {
            end_rank = start_rank;
        }
        end_rank = Math.floor(end_rank);
        if (end_rank <= 0) {
            end_rank = 1;
        }
        if (end_rank > character.getMaxRank()) {
            end_rank = character.getMaxRank();
        }
        if (end_rank < start_rank) {
            start_rank = end_rank;
            onchangeStartRank();
        }
        if (end_rank > 0 && end_rank <= character.getMaxRank() && end_rank !== end_rank_prev) {
            end_equips = character.equipment(id, end_rank) as string[];
            end_equipped = [false, false, false, false, false, false];
            end_rank_prev = end_rank;
        }
    }

    function validateProject() {
        if (isNaN(start_rank)) {
            start_rank = 1;
        }
        if (isNaN(end_rank)) {
            end_rank = start_rank;
        }
        if (isNaN(regular_count)) {
            regular_count = 0;
        }
        if (isNaN(pure_count)) {
            pure_count = 0;
        }
        start_rank = Math.floor(start_rank);
        end_rank = Math.floor(end_rank);
        regular_count = Math.floor(regular_count);
        pure_count = Math.floor(pure_count);
        const start_count = start_equipped.filter(Boolean).length;
        const end_count = end_equipped.filter(Boolean).length;

        if (start_rank === end_rank) {
            // make sure all start items are selected in end items
            for (let i = 0 ; i < 6 ; i++) {
                if (start_equipped[i] && !end_equipped[i]) {
                    // alert: end result is missing items that start has.
                    showError("End result is missing items that start has.");
                    return false;
                }
            }
            if (regular_count + pure_count >= 1) {
                // memory pieces exist
                generateProject();
                return true;
            }
            // at least 1 new item needs to be selected
            if (start_count >= end_count) {
                // alert: start has more or equal items than the end result.
                showError("Start has more or equal items than the end result.");
                return false;
            }
        }
        else if (start_rank + 1 === end_rank && start_count === 6 && end_count === 0) {
            // make sure start rank isn't 6 items and end rank is 0 selected
            // alert: no new items are selected in end result.
            showError("No new items are selected in end result.");
            return false;
        }
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
        const result : CharacterProject = {
            type: "character",
            date: (project ? project.date : Date.now()),
            priority: (project ? project.priority : false),
            details: {
                avatar_id: id,
                formal_name: `${character_name} (${id})`,
                name: project_name,
                start: {
                    rank: start_rank,
                    equipment: start_equipped,
                },
                end: {
                    rank: end_rank,
                    equipment: end_equipped,
                },
                memory_piece: regular_count,
                pure_memory_piece: pure_count,
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
        console.time("build_character_project");
        let items : Recipe = {};
        let item_id : string;
        let counter : number = 0;
        for (let i = start_rank ; i <= end_rank ; i++) {
            for (let j = 0 ; j < 6 ; j++) {
                item_id = (character.equipment(id, i) as string[])[j] || constants.placeholder_id;
                if (item_id === constants.placeholder_id) {
                    // ignore placeholder/missing items
                    continue;
                }
                if (start_rank === end_rank) {
                    // start and end rank is the same
                    // add whatever item start doesn't have but end does
                    // we can assume that end has every item start has (due to validation prior to this function)
                    if (!start_equipped[j] && end_equipped[j]) {
                        increment();
                    }
                }
                else if (i === end_rank && end_equipped[j]) {
                    // we are looking at the end rank
                    // only add items that are selected
                    increment();
                }
                else if (i < end_rank) {
                    if (i === start_rank && start_equipped[j]) {
                        // we are looking at the start rank
                        // ignore items that start already has
                        continue;
                    }
                    increment();
                }
            }
        }

        // append memory pieces
        if (regular_count > 0) {
            items = {
                ...items,
                [regular_piece]: regular_count,
            };
            counter += regular_count;
        }
        if (pure_count > 0) {
            items = {
                ...items,
                [pure_piece]: pure_count,
            };
        }
        console.timeEnd("build_character_project");
        console.table(items);
        console.log("total items:", counter);
        return items;

        function increment() {
            items[item_id] = items[item_id] ? items[item_id] + 1 : 1;
            counter++;
        }
    }

    function loadSavedCharacter() {
        const saved_character = user.character.getCharacter(id);
        start_rank = start_rank_prev = saved_character.rank;
        onchangeStartRank();
        start_equips = character.equipment(id, start_rank) as string[];
        start_equipped = [...saved_character.equipment]; // using this without cloning will result in changes to saved_character
    }

    export function complete() {
        validateProject();
    }
</script>

<div class="flex flex-wrap flex-col items-center justify-center gap-4" {...$$restProps}>
    <div class="flex flex-row items-center justify-center gap-2 font-extrabold text-md sm:text-2xl">
        <CharacterAvatar avatar={id} large />
        <div>{character_name}</div>
    </div>
    <MenuSurface bind:this={surface} class="bg-[#FDEDED] text-[#5F2120] p-4 opacity-[95%] w-full" anchorCorner="TOP_LEFT">
        <div class="font-bold">Invalid Project Error</div>
        <small>{error.message}</small>
    </MenuSurface>
    <div>
        <!-- svelte-ignore a11y-autofocus | input here to try to stop autofocus on the name input -->
        <input type="hidden" style="display:none;" autofocus={true} />
        <Textfield bind:value={project_name} label="Project Name" class="w-full">
            <HelperText slot="helper">Optional</HelperText>
        </Textfield>
    </div>
    {#if project && project.partially_completed}
        <div class="flex flex-row select-none gap-2 justify-center items-center mb-3 text-[#5F2120]">
            <span class="material-icons">warning</span>
            <small>
                <strong>This project has been partially completed before.</strong><br/>
                Editing the project will revert these changes.
            </small>
        </div>
    {/if}
    <div class="w-full mb-2">
        <hr />
        <div class="title text-left">Start Details</div>
        <Textfield bind:value={start_rank} label="Start Rank" type="number" input$min="1"
            on:change={onchangeStartRank}
            input$max={character.getMaxRank()} class="w-full">
            <HelperText slot="helper">Starting rank for project.</HelperText>
        </Textfield>
        <div class="flex flex-row items-center justify-center gap-2 select-none mt-2 mb-2">
            {#each start_equips as item_id, i (`${item_id}-${i}`)}
                <ItemButton id={item_id} ignore_amount
                    {...(item_id !== constants.placeholder_id && { click: () => start_equipped[i] = !start_equipped[i] })}
                    class={"transition-all h-12 w-12"
                        + (start_equipped[i] || item_id === constants.placeholder_id ? "" : " hover:grayscale-0 grayscale opacity-50 hover:opacity-80")
                        + (item_id === constants.placeholder_id ? " opacity-30" : "")
                    }
                />
            {/each}
        </div>
        <Button on:click={loadSavedCharacter} variant="outlined" class="w-full" disabled={!user.character.exists(id)}>
            <Label>Use Saved Character</Label>
        </Button>
    </div>
    <div class="w-full mb-2">
        <hr />
        <div class="title text-left">End Details</div>
        <Textfield bind:value={end_rank} label="End Rank" type="number" input$min="1"
            on:change={onchangeEndRank}
            input$max={character.getMaxRank()} class="w-full">
            <HelperText slot="helper">Ending rank for project.</HelperText>
        </Textfield>
        <div class="flex flex-row items-center justify-center gap-2 select-none mt-2">
            {#each end_equips as item_id, i (`${item_id}-${i}`)}
                <ItemButton id={item_id} ignore_amount
                    {...(item_id !== constants.placeholder_id && { click: () => end_equipped[i] = !end_equipped[i] })}
                    class={"transition-all h-12 w-12"
                        + (end_equipped[i] || item_id === constants.placeholder_id ? "" : " hover:grayscale-0 grayscale opacity-50 hover:opacity-80")
                        + (item_id === constants.placeholder_id ? " opacity-30" : "")
                    }
                />
            {/each}
        </div>
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
        {#if regular_exists || pure_exists}
            <div class="font-bold">
                <small>ADD MEMORY PIECE</small>
            </div>
            {#if regular_exists}
                <div class="flex flex-row items-center justify-center gap-4 select-none">
                    <div class="w-12">
                        <ItemImage id={regular_piece} props={{class: "w-10 h-10"}} />
                    </div>
                    <div class="w-full">
                        <Textfield bind:value={regular_count} label="Memory Piece" type="number" input$min="0"
                            input$max={constants.inventory.max.full} class="w-full">
                            <HelperText slot="helper">Amount of <strong>Memory Piece</strong> to add to project.</HelperText>
                        </Textfield>
                    </div>
                </div>
            {/if}
            {#if pure_exists}
                <div class="flex flex-row items-center justify-center gap-4 select-none">
                    <div class="w-12">
                        <ItemImage id={pure_piece} props={{class: "w-10 h-10"}} />
                    </div>
                    <div class="w-full">
                        <Textfield bind:value={pure_count} label="Pure Memory Piece" type="number" input$min="0"
                            input$max={constants.inventory.max.full} class="w-full">
                            <HelperText slot="helper">Amount of <strong>Pure Memory Piece</strong> to add to project.</HelperText>
                        </Textfield>
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>

<style>
    .title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
</style>