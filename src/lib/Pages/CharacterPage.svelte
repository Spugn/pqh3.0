<script context="module">
    import { user, equipment as equipmentAPI, character as characterAPI, inventory as inventoryAPI, constants,
        recipe as recipeAPI
    } from "$lib/api/api";
    import CharacterButton from "$lib/Character/Button.svelte";
    import ItemButton from "$lib/Item/Button.svelte";
    import Button, { Label, Icon } from "@smui/button";
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import TextfieldIcon from '@smui/textfield/icon';
    import Image from "$lib/Image.svelte";
    import Checkbox from '@smui/checkbox';
    import FormField from '@smui/form-field';
</script>

<script lang="ts">
    import type { SavedCharacter, Recipe } from "$lib/api/api.d";
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
    }
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
</script>

<section class="pb-[5vh]">
    <div class="flex flex-col gap-4">
        <div class="bg-white rounded-md mx-6 p-3">
            <Textfield bind:value={search_query} label="Search" class="w-full">
                <TextfieldIcon class="material-icons" slot="leadingIcon">search</TextfieldIcon>
                <HelperText slot="helper">Search for a character name or ID.</HelperText>
            </Textfield>
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
</section>

<style>
    .title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
</style>