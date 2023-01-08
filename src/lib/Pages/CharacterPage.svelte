<script context="module">
    import { user, equipment as equipmentAPI, character as characterAPI, inventory as inventoryAPI, constants,
        recipe as recipeAPI, project as projectAPI
    } from "$lib/api/api";
    import CharacterButton from "$lib/Character/Button.svelte";
    import ItemButton from "$lib/Item/Button.svelte";
    import ItemImage from "$lib/Item/Image.svelte";
    import Button, { Label, Icon } from "@smui/button";
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import TextfieldIcon from '@smui/textfield/icon';
    import Image from "$lib/Image.svelte";
    import Checkbox from '@smui/checkbox';
    import FormField from '@smui/form-field';
    import MenuSurface from '@smui/menu-surface';
    import MiniProjectTitle from "$lib/Project/MiniProjectTitle.svelte";
</script>

<script lang="ts">
    import type { SavedCharacter, Recipe, CharacterProject } from "$lib/api/api.d";
    interface CharacterButtonData {
        id : string; // unit id
        rank : number; // unit rank
    }
    interface DialogCharacter {
        id : string | undefined; // unit id
        rank : number; // rank in dialog input
        prev_rank : number; // previous rank selected
        equips : string[]; // array of item ids, equips to display
        equipped : [boolean, boolean, boolean, boolean, boolean, boolean]; // equipped or not
        consume_inventory : boolean; // if new items should be removed from inventory
    };
    interface DialogBulkCreate {
        character: string[];
        equipped : [boolean, boolean, boolean, boolean, boolean, boolean]; // equipped or not
        target_rank : number;
        character_options: string[];
        error: string;
        step: number;
        generated_projects: CharacterProject[];
        selected_index: number;
        required_fragments: Recipe;
    };
    let characters : CharacterButtonData[] = [];
    let search_query = ""; // text input for what to search for
    let filter : string[] = []; // search results
    let open_dialog : boolean = false;
    let dialog_data : DialogCharacter = {
        id: undefined,
        rank: 1,
        prev_rank: 1,
        equips: [],
        equipped: [false, false, false, false, false, false],
        consume_inventory: false,
    };
    let open_bulk_create_dialog : boolean = false;
    let surface : MenuSurface;
    let session_ignored = user.getSessionIgnoredRarities();
    let bulk_create_dialog_data : DialogBulkCreate = {
        character: [],
        equipped: [false, false, false, false, false, false],
        target_rank: 1,
        character_options: [],
        error: "",
        step: 0,
        generated_projects: [],
        selected_index: 0,
        required_fragments: {},
    };
    $: if (open_bulk_create_dialog) {
        bulk_create_dialog_data.character = [];
        bulk_create_dialog_data.step = 0;
        bulk_create_dialog_data.required_fragments = {};
        validateTargetRank();
    }
    function validateTargetRank() {
        //bulk_create_dialog_data.character = []; // reset
        bulk_create_dialog_data.character_options = []; // reset

        let target_rank = bulk_create_dialog_data.target_rank;
        target_rank = Math.floor(target_rank);
        if (isNaN(target_rank) || target_rank < 1) {
            target_rank = 1;
        }
        if (target_rank > characterAPI.getMaxRank()) {
            target_rank = characterAPI.getMaxRank();
        }
        bulk_create_dialog_data.target_rank = target_rank;

        // build options
        for (const id of Object.keys(user.character.get())) {
            if (user.character.get()[id].rank <= bulk_create_dialog_data.target_rank) {
                // character is a valid option at this target rank
                bulk_create_dialog_data.character_options.push(id);
            }
            else if (bulk_create_dialog_data.character.includes(id)) {
                // character is no longer valid but is selected, then delete
                const temp_set = new Set(bulk_create_dialog_data.character);
                temp_set.delete(id);
                bulk_create_dialog_data.character = Array.from(temp_set);
            }
        }
    }
    const button_css = "inline-block dark-shadow-md rounded-md transition-opacity w-12 h-12 grayscale";

    function updateCharacters() {
        characters = [];
        Object.entries(characterAPI.data)
            .filter(([id]) => search_query === "" || filter.includes(id))
            .forEach(([id]) => {
                const rank = user.character.getCharacter(id)?.rank || 0;
                characters.push({
                    id,
                    rank,
                });
            });
        characters.sort((a, b) => {
            if (a.rank > b.rank) return -1; // rank sort, descending
            if (a.rank < b.rank) return 1;
            return 0;
        });
    }
    $: {
        filter = characterAPI.search(search_query);
        updateCharacters();
    };

    function updateRank() {
        dialog_data.rank = Math.floor(dialog_data.rank);
        dialog_data.prev_rank = dialog_data.rank;
        dialog_data.equips = [...characterAPI.equipment(dialog_data.id as string, dialog_data.rank) as string[]];
        const char = user.character.getCharacter(dialog_data.id as string);
        dialog_data.equipped = (dialog_data.rank === char?.rank) ? [...char.equipment]
            : [false, false, false, false, false, false];
    }
    function handleCharacterClick(id : string) {
        open_dialog = true;
        dialog_data.id = id;
        dialog_data.rank = dialog_data.prev_rank = user.character.getCharacter(id)?.rank || 1;
        updateRank();
    }
    $: if (open_dialog && dialog_data.id && (dialog_data.rank !== dialog_data.prev_rank)) {
        updateRank();
    }

    function isEquipped(index : number) {
        return dialog_data.equipped[index];
    }

    function handleEquipClick(index : number) {
        dialog_data.equipped[index] = !dialog_data.equipped[index];
    }

    function save() {
        open_dialog = false;
        dialog_data.rank = Math.floor(dialog_data.rank);
        if (isNaN(dialog_data.rank) || dialog_data.rank < 1) {
            dialog_data.rank = 1;
        }
        else if (dialog_data.rank > characterAPI.getMaxRank()) {
            dialog_data.rank = characterAPI.getMaxRank();
        }
        const char : SavedCharacter = user.character.getCharacter(dialog_data.id as string)
            || {
                id: dialog_data.id,
                rank: 1,
                equipment: [false, false, false, false, false, false],
            };
        if (dialog_data.consume_inventory) {
            let consumed : Recipe = {};
            if (char.rank <= dialog_data.rank) {
                // only care about ranks greater than or equal to current saved ranks, ignore downgrades
                for (let r = char.rank ; r <= dialog_data.rank ; r++) {
                    console.log(r);
                    for (let i = 0 ; i < 6 ; i++) {
                        // if rank is same as dialog rank and is equipped (but not equipped in saved), add
                        // if rank is less than dialog rank but is equal to saved rank and not equipped in saved, add
                        // if rank is less than dialog rank but is not equal to saved rank, add
                        if (((r === dialog_data.rank) && dialog_data.equipped[i] && !char.equipment[i])
                            || (r < dialog_data.rank && r === char.rank && !char.equipment[i])
                            || (r < dialog_data.rank && r !== char.rank)) {
                            const equip = (characterAPI.equipment(dialog_data.id as string, r) as string[])[i];
                            consumed[equip] = consumed[equip] ? consumed[equip] + 1 : 1;
                        }
                    }
                }
            }
            if (Object.keys(consumed).length > 0) {
                let recipe : Recipe = {};
                for (const item_id in consumed) {
                    recipe = recipeAPI.merge(recipe, recipeAPI.build(item_id, consumed[item_id], user.region.get(), {}));
                }
                console.table(consumed);
                console.table(recipe);
                user.inventory.set(inventoryAPI.removeRecipe(user.inventory.get(), recipe));
            }
        }
        user.character.setCharacter(dialog_data.id as string, dialog_data.rank, dialog_data.equipped);
        updateCharacters();
    }

    function deleteCharacter() {
        open_dialog = false;
        user.character.remove(dialog_data.id as string);
        updateCharacters();
    }

    function hideContentCheck(id : string, rank : number) {
        if (!user.settings.hideContent()) {
            return true;
        }
        return characterAPI.existsInRegion(id, user.region.get()) || rank > 0;
    }

    function isProjectEquipped(index : number) {
        return bulk_create_dialog_data.equipped[index];
    }

    function handleProjectEquipClick(index : number) {
        bulk_create_dialog_data.equipped[index] = !bulk_create_dialog_data.equipped[index];
    }

    function validateBulkProjects() {
        if (bulk_create_dialog_data.character.length <= 0) {
            // no characters selected
            showBulkProjectError("No characters selected.");
            return;
        }
        const projs = projectAPI.bulkCreateProjects(bulk_create_dialog_data.character,
            bulk_create_dialog_data.target_rank, bulk_create_dialog_data.equipped, session_ignored);
        if (projs.length <= 0) {
            // no projects can be created
            showBulkProjectError("No valid projects were generated.");
            return;
        }
        bulk_create_dialog_data.generated_projects = projs;
        bulk_create_dialog_data.selected_index = 0;

        const p = bulk_create_dialog_data.generated_projects[bulk_create_dialog_data.selected_index];
        bulk_create_dialog_data.required_fragments = projectAPI.build(p, {}, user.region.get(), p.details.ignored_rarities);

        bulk_create_dialog_data.step = 1;
    }
    function showBulkProjectError(message : string) {
        bulk_create_dialog_data.error = message;
        surface.setOpen(true);
    }
    function completeBulkProject() {
        open_bulk_create_dialog = false;
        for (const proj of bulk_create_dialog_data.generated_projects) {
            if (proj.details.avatar_id === "999999") {
                // skip "All Projects" if needed
                continue;
            }
            user.projects.add(proj);
        }
    }
</script>

<section class="pb-[5vh]">
    <div class="flex flex-col gap-4">
        <div class="bg-white rounded-md mx-6 p-3">
            <Textfield bind:value={search_query} label="Search" class="w-full">
                <TextfieldIcon class="material-icons" slot="leadingIcon">search</TextfieldIcon>
                <HelperText slot="helper">Search for a character name or ID.</HelperText>
            </Textfield>
        </div>
        <div class="flex flex-row gap-1 w-[90vw] self-center">
            <Button color="primary" variant="raised" class="flex-1"
                on:click={() => open_bulk_create_dialog = true}
            >
                <Icon class="material-icons">add</Icon>
                <Label>Bulk Create Projects</Label>
            </Button>
        </div>
        <div class="flex flex-row flex-wrap items-center justify-center gap-1">
            {#each characters as { id, rank } (`${id}-${rank}`)}
                {#if hideContentCheck(id, rank)}
                    <CharacterButton {id} click={() => handleCharacterClick(id)} {rank} />
                {/if}
            {/each}
        </div>
    </div>
    <Dialog bind:open={open_dialog} class="text-black z-[1001]">
        <!-- z-index needs to be above miyako menu button (z-index 1000) -->
        {#if open_dialog}
            <div class="title pl-2 pt-1">Edit Character</div>
            <DialogContent class="text-center">
                {#if dialog_data.id}
                    <div class="font-extrabold text-md sm:text-2xl">
                        {characterAPI.name(dialog_data.id, user.region.get())}
                    </div>
                    <div class="text-black/[0.5] font-bold sm:text-xl mb-3">
                        ({dialog_data.id})
                    </div>
                    <div class="grid grid-cols-3">
                        <div class="place-self-end flex flex-col mr-2">
                            {#key `${dialog_data.equips[0]}-${dialog_data.equipped[0]}`}
                                <ItemButton id={dialog_data.equips[0]} ignore_amount
                                    {...((dialog_data.equips[0] !== constants.placeholder_id) && {
                                        click: () => handleEquipClick(0),
                                        class: `${button_css} ${isEquipped(0) ? "grayscale-0"
                                            : "opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]"}`,
                                    })}
                                    {...((dialog_data.equips[0] === constants.placeholder_id) && {
                                        class: `${button_css} opacity-20`,
                                    })}
                                />
                            {/key}
                            {#key `${dialog_data.equips[2]}-${dialog_data.equipped[2]}`}
                                <ItemButton id={dialog_data.equips[2]} ignore_amount
                                    {...((dialog_data.equips[2] !== constants.placeholder_id) && {
                                        click: () => handleEquipClick(2),
                                        class: `${button_css} my-4 relative right-3 ${isEquipped(2) ? "grayscale-0"
                                            : "opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]"}`,
                                    })}
                                    {...((dialog_data.equips[2] === constants.placeholder_id) && {
                                        class: `${button_css} my-4 relative right-3 opacity-20`,
                                    })}
                                />
                            {/key}
                            {#key `${dialog_data.equips[4]}-${dialog_data.equipped[4]}`}
                                <ItemButton id={dialog_data.equips[4]} ignore_amount
                                    {...((dialog_data.equips[4] !== constants.placeholder_id) && {
                                        click: () => handleEquipClick(4),
                                        class: `${button_css} ${isEquipped(4) ? "grayscale-0"
                                            : "opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]"}`,
                                    })}
                                    {...((dialog_data.equips[4] === constants.placeholder_id) && {
                                        class: `${button_css} opacity-20`,
                                    })}
                                />
                            {/key}
                        </div>
                        <div class="place-self-center max-w-lg">
                            <Image img={dialog_data.id} type="unit_icon" alt={``}
                                props={{
                                    draggable: false,
                                    class: "w-15 h-15 sm:w-min sm:h-min rounded-xl dark-shadow-md"
                                }}
                            />
                        </div>
                        <div class="place-self-start flex flex-col ml-2">
                            {#key `${dialog_data.equips[1]}-${dialog_data.equipped[1]}`}
                                <ItemButton id={dialog_data.equips[1]} ignore_amount
                                    {...((dialog_data.equips[1] !== constants.placeholder_id) && {
                                        click: () => handleEquipClick(1),
                                        class: `${button_css} ${isEquipped(1) ? "grayscale-0"
                                            : "opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]"}`,
                                    })}
                                    {...((dialog_data.equips[1] === constants.placeholder_id) && {
                                        class: `${button_css} opacity-20`,
                                    })}
                                />
                            {/key}
                            {#key `${dialog_data.equips[3]}-${dialog_data.equipped[3]}`}
                                <ItemButton id={dialog_data.equips[3]} ignore_amount
                                    {...((dialog_data.equips[3] !== constants.placeholder_id) && {
                                        click: () => handleEquipClick(3),
                                        class: `${button_css} my-4 relative left-3 ${isEquipped(3) ? "grayscale-0"
                                            : "opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]"}`,
                                    })}
                                    {...((dialog_data.equips[3] === constants.placeholder_id) && {
                                        class: `${button_css} my-4 relative left-3 opacity-20`,
                                    })}
                                />
                            {/key}
                            {#key `${dialog_data.equips[5]}-${dialog_data.equipped[5]}`}
                                <ItemButton id={dialog_data.equips[5]} ignore_amount
                                    {...((dialog_data.equips[5] !== constants.placeholder_id) && {
                                        click: () => handleEquipClick(5),
                                        class: `${button_css} ${isEquipped(5) ? "grayscale-0"
                                            : "opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]"}`,
                                    })}
                                    {...((dialog_data.equips[5] === constants.placeholder_id) && {
                                        class: `${button_css} opacity-20`,
                                    })}
                                />
                            {/key}
                        </div>
                    </div>
                    <div class="mt-2">
                        <Textfield bind:value={dialog_data.rank} label="Rank" type="number" input$min="1"
                            input$max={characterAPI.getMaxRank()} class="w-full"
                        >
                            <HelperText slot="helper">Rank of character.</HelperText>
                        </Textfield>
                    </div>
                    <div class="mt-2">
                        <FormField>
                            <Checkbox bind:checked={dialog_data.consume_inventory} />
                            <span slot="label">
                                Consume Inventory?<br/>
                                <small class="opacity-70">Remove <strong>new</strong> items from inventory.</small>
                            </span>
                        </FormField>
                    </div>
                {/if}
            </DialogContent>
        {/if}
        <Actions class="flex flex-col gap-2 w-full">
            <div class="w-full">
                <Button variant="raised" class="w-full" style="background-color:#D32F2F;"
                    on:click={deleteCharacter}
                >
                    <Icon class="material-icons">delete</Icon>
                    <Label>Delete</Label>
                </Button>
            </div>
            <div class="flex flex-row gap-1 w-full">
                <div class="flex-1">
                    <Button color="secondary" variant="outlined" class="w-full">
                        <Icon class="material-icons">close</Icon>
                        <Label>Close</Label>
                    </Button>
                </div>
                <div class="flex-1">
                    <Button variant="raised" on:click={save} class="w-full" style="background-color:#1976D2;">
                        <Icon class="material-icons">save</Icon>
                        <Label>Save</Label>
                    </Button>
                </div>
            </div>
        </Actions>
    </Dialog>
    <!-- bulk create projects -->
    <Dialog bind:open={open_bulk_create_dialog} class="text-black z-[1001]">
        <!-- z-index needs to be above miyako menu button (z-index 1000) -->
        <div class="title pl-2 pt-1">Bulk Create Projects</div>
        <DialogContent class="text-center flex flex-col gap-3">
            {#if bulk_create_dialog_data.step === 0}
                <MenuSurface bind:this={surface} class="bg-[#FDEDED] text-[#5F2120] p-4 opacity-[95%] w-full" anchorCorner="TOP_LEFT">
                    <div class="font-bold">Error</div>
                    <small>{bulk_create_dialog_data.error}</small>
                </MenuSurface>
                <div class="flex flex-col gap-1">
                    <div class="title self-start">Characters</div>
                    <div class="flex flex-row gap-[0.5] flex-wrap">
                        {#if bulk_create_dialog_data.character_options.length > 0}
                            {#each bulk_create_dialog_data.character_options as id (`${id}-${bulk_create_dialog_data.target_rank}`)}
                                {#key `${id}-${bulk_create_dialog_data.character.includes(id)}`}
                                    <CharacterButton {id} ignore_rank
                                        style={`height: 32px; width: 32px;${bulk_create_dialog_data.character.includes(id) ? "" : "filter: grayscale(100%); opacity:0.8;"}`}
                                        click={() => {
                                            if (!bulk_create_dialog_data.character.includes(id)) {
                                                bulk_create_dialog_data.character.push(id);
                                                bulk_create_dialog_data = bulk_create_dialog_data;
                                                return;
                                            }
                                            const temp_set = new Set(bulk_create_dialog_data.character);
                                            temp_set.delete(id);
                                            bulk_create_dialog_data.character = Array.from(temp_set);
                                        }}
                                    />
                                {/key}
                            {/each}
                        {:else}
                            <small class="text-left">
                                <strong>No valid characters found</strong>
                                <li class="text-red-600">Choose a higher target rank.</li>
                                <li class="text-red-600">Mark more characters as "owned".</li>
                            </small>
                        {/if}

                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <div class="title self-start">Target Equipment</div>
                    <div class="flex flex-row gap-6 justify-center items-center">
                        <div class="flex flex-col gap-1">
                            {#each [0, 2, 4] as index}
                                {#key bulk_create_dialog_data.equipped[index]}
                                    <ItemButton id={constants.placeholder_id} ignore_amount
                                        click={() => handleProjectEquipClick(index)}
                                        class={`${button_css} ${isProjectEquipped(index) ? "grayscale-0"
                                            : "opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]"}`}
                                    />
                                {/key}
                            {/each}
                        </div>
                        <div class="flex flex-col gap-1">
                            {#each [1, 3, 5] as index}
                                {#key bulk_create_dialog_data.equipped[index]}
                                    <ItemButton id={constants.placeholder_id} ignore_amount
                                        click={() => handleProjectEquipClick(index)}
                                        class={`${button_css} ${isProjectEquipped(index) ? "grayscale-0"
                                            : "opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]"}`}
                                    />
                                {/key}
                            {/each}
                        </div>
                    </div>
                </div>
                <div>
                    <Textfield bind:value={bulk_create_dialog_data.target_rank} label="Target Rank" type="number"
                        on:change={validateTargetRank}
                        input$min="1" input$max={characterAPI.getMaxRank()} class="w-full"
                    >
                        <HelperText slot="helper">Target end rank of all projects.</HelperText>
                    </Textfield>
                </div>
                <div class="flex flex-col gap-1">
                    <div class="title self-start">Ignored Rarities</div>
                    <div class="flex flex-row items-center justify-center gap-1 select-none max-w-[415px]">
                        {#each Array(equipmentAPI.getMaxRarity()) as _, i (`${i}-${session_ignored[i + 1]}`)}
                            <ItemButton id={`99${i + 1}999`} ignore_amount
                                click={() => {
                                    session_ignored[i + 1] = !session_ignored[i + 1];
                                    if (!session_ignored[i + 1]) {
                                        delete session_ignored[i + 1];
                                    }
                                    user.settings.setSavedSessionIgnoredRarities();
                                }}
                                class={"transition-all h-12 w-12"
                                    + (session_ignored[i + 1] ? " hover:grayscale-0 grayscale opacity-50 hover:opacity-80" : "")
                                }
                            />
                        {/each}
                    </div>
                </div>
            {/if}
            {#if bulk_create_dialog_data.step === 1}
                <small class="flex flex-col text-red-600 text-left">
                    <li>Click on a project to see the project's required items.</li>
                    <li>Click <strong>CONFIRM</strong> to add the project(s) to your project list.</li>
                </small>
                <div class="flex flex-col gap-1">
                    <div class="title self-start">Generated {bulk_create_dialog_data.generated_projects.length} project(s)</div>
                    <div class="flex flex-row flex-wrap gap-1 max-h-[300px] overflow-auto p-3">
                        {#each bulk_create_dialog_data.generated_projects as p, i (JSON.stringify(p))}
                            <button class="rounded-md text-left"
                                class:outline={bulk_create_dialog_data.selected_index === i}
                                class:outline-4={bulk_create_dialog_data.selected_index === i}
                                class:outline-pink-500={bulk_create_dialog_data.selected_index === i}
                                on:click={() => {
                                    bulk_create_dialog_data.selected_index = i;
                                    const p = bulk_create_dialog_data.generated_projects[bulk_create_dialog_data.selected_index];
                                    bulk_create_dialog_data.required_fragments = projectAPI.build(p, {}, user.region.get(), p.details.ignored_rarities);
                                }}
                            >
                                <MiniProjectTitle thumbnail={p.details.avatar_id} project_type="character" priority={false}
                                    project_name="Untitled Project" subtitle={p.details.formal_name} start_rank={p.details.start.rank}
                                    end_rank={p.details.end.rank} progress={-1}
                                />
                            </button>
                        {/each}
                    </div>
                </div>
                <div class="flex flex-col gap-1">
                    <div class="title self-start">Required Fragments</div>
                    <div class="flex flex-row flex-wrap gap-1 max-h-[300px] overflow-auto bg-black/[0.2] rounded-md p-1">
                        {#each Object.keys(bulk_create_dialog_data.required_fragments) as req (`${req}-${bulk_create_dialog_data.required_fragments[req]}`)}
                            <div class="relative">
                                <ItemImage id={req} props={{ height: 40, width: 40 }} />
                                <strong class="amount">
                                    {bulk_create_dialog_data.required_fragments[req]}
                                </strong>
                            </div>
                        {/each}
                    </div>
                    <div class="title self-start">Required Items</div>
                    <div class="flex flex-row flex-wrap gap-1 max-h-[300px] overflow-auto bg-black/[0.2] rounded-md p-1">
                        {#each Object.keys(bulk_create_dialog_data.generated_projects[bulk_create_dialog_data.selected_index].required) as req (`${req}-${bulk_create_dialog_data.generated_projects[bulk_create_dialog_data.selected_index].required[req]}`)}
                            <div class="relative">
                                <ItemImage id={req} props={{ height: 40, width: 40 }} />
                                <strong class="amount">
                                    {bulk_create_dialog_data.generated_projects[bulk_create_dialog_data.selected_index].required[req]}
                                </strong>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </DialogContent>
        <Actions class="flex flex-row gap-1 w-full">
            {#if bulk_create_dialog_data.step === 0}
                <Button color="secondary" variant="outlined" class="flex-1">
                    <Icon class="material-icons">close</Icon>
                    <Label>Close</Label>
                </Button>
                <Button variant="raised" on:click={validateBulkProjects} class="flex-1" action="">
                    <Icon class="material-icons">add</Icon>
                    <Label>Create</Label>
                </Button>
            {/if}
            {#if bulk_create_dialog_data.step === 1}
                <Button color="secondary" variant="outlined" class="flex-1" action=""
                    on:click={() => bulk_create_dialog_data.step = 0}
                >
                    <Icon class="material-icons">arrow_back</Icon>
                    <Label>Back</Label>
                </Button>
                <Button variant="raised" on:click={completeBulkProject} class="flex-1" action="">
                    <Icon class="material-icons">done</Icon>
                    <Label>Confirm</Label>
                </Button>
            {/if}
        </Actions>
    </Dialog>
</section>

<style>
    .title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
    .amount {
        position: absolute;
        font-family: "Calibri", Arial, serif;
        bottom: 0.175rem;
        right: 0.1rem;
        color: white;
        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
    }
    .amount::before {
        content: '\00D7';
    }
</style>