<script context="module">
    import Dialog, { Header, Title, Content as DialogContent, Actions } from '@smui/dialog';
    import IconButton from '@smui/icon-button';
    import Button, { Icon, Label } from "@smui/button";
    import { createEventDispatcher } from 'svelte';
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
    import AmountButtons from './AmountButtons.svelte';
    import QuestSettings from "$lib/QuestSettings.svelte";
    import InfiniteScroll from "./InfiniteScroll.svelte";
    import QuestEntry from "./QuestEntry.svelte";
    import { constants, user, quest as questAPI, inventory as inventoryAPI } from "$lib/api/api";
    import ItemCatalog from "$lib/Catalog/ItemCatalog.svelte";
    import QuestItemImage from "./QuestItemImage.svelte";
    import QuestHeader from "./QuestHeader.svelte";
    import QuestItemButton from "./QuestItemButton.svelte";
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    import type { Quest, QuestBuild2Results, QuestItem, QuestScore } from "$lib/api/api.d";

    export let open : boolean = false;
    export let quest_build_results : QuestBuild2Results;
    export const increment = 10; // amount of quests to add every new addition

    let open_item_details : boolean = false; // item detail/inventory edit modal
    let open_quest_details : boolean = false; // quest detail/bulk edit modal
    let open_settings : boolean = false; // settings dialog

    let open_item_filter_dialog : boolean = false;
    let filtered_items : string[] = user.settings.quest.getItemFilter();
    let setting_changed : boolean = false;

    let results : QuestScore[] = [];
    let new_results : QuestScore[] = [];

    let edit_inventory_dialog = {
        id: constants.placeholder_id,
        inventory: 0,
        drop_rate: 0,
        required: 0,
        required_missing: 0,
        priority_required: 0,
        drop_buff: 3,
        commit_changes: false,
    };

    interface QuestDetailsDialog {
        id : string; // quest id
        quest? : Quest; // quest info
        score : number; // quest score
        drops : DetailedQuestDrop[]; // for data table
    };
    let quest_details_dialog : QuestDetailsDialog = {
        id: "1-1",
        quest: undefined,
        score: 0,
        drops: [],
    }

    function addQuests() {
        new_results = quest_build_results.quest_scores.slice(results.length, results.length + increment);
    }

    $: if (open) {
        document.body.style.overflow = "hidden";
    }
    else {
        document.body.style.overflow = "";
    }

    $: if (open && quest_build_results) {
        // first run
        results = new_results = [];
        addQuests();
    }

    $: results = [
        ...results,
        ...new_results,
    ];

    $: if (setting_changed && !open_settings) {
        // a setting was changed and settings dialog was closed. need to rebuild quests
        dispatch("rebuild");
        setting_changed = false;
    }

    $: edit_inventory_dialog.required_missing = calcRequiredMissing(edit_inventory_dialog.inventory, edit_inventory_dialog.required);

    $: if (edit_inventory_dialog.commit_changes && !open_item_details) {
        edit_inventory_dialog.commit_changes = false;
        if (user.inventory.getAmount(edit_inventory_dialog.id) !== edit_inventory_dialog.inventory) {
            validateInventory();
        }
    }

    function calcRequiredMissing(inventory : number, required : number) {
        const diff = required - inventory;
        return (diff > 0) ? diff : 0;
    }

    function addInventory(amount : number) {
        if (isNaN(edit_inventory_dialog.inventory)) {
            edit_inventory_dialog.inventory = 0;
        }
        edit_inventory_dialog.inventory += amount;
        onchangeInventory();
    }

    function subInventory(amount : number) {
        if (isNaN(edit_inventory_dialog.inventory)) {
            edit_inventory_dialog.inventory = 0;
        }
        edit_inventory_dialog.inventory -= amount;
        onchangeInventory();
    }

    function onchangeInventory() {
        if (edit_inventory_dialog.inventory <= 0) {
            edit_inventory_dialog.inventory = 0;
            return;
        }
        if (edit_inventory_dialog.inventory > constants.inventory.max.fragment) {
            edit_inventory_dialog.inventory = constants.inventory.max.fragment;
        }
    }

    // @ts-ignore - ignoring because event is a CustomEvent and it doesn't have charCode
    function keypressInventoryEdit(event) {
        if (event.charCode === 13) { // on ENTER key press
            open_item_details = false;
        }
    }

    function validateInventory() {
        edit_inventory_dialog.inventory = Math.floor(edit_inventory_dialog.inventory);
        if (isNaN(edit_inventory_dialog.inventory) || edit_inventory_dialog.inventory <= 0) {
            user.inventory.set(inventoryAPI.remove(user.inventory.get(), edit_inventory_dialog.id));
            dispatch('update_inventory');
            setTimeout(() => {
                // needs to be after dispatch in a different "thread"
                if (open_quest_details) {
                    updateDetailedQuestDrops();
                }
            });
            return;
        }
        user.inventory.set(inventoryAPI.set(user.inventory.get(), edit_inventory_dialog.id, edit_inventory_dialog.inventory));
        dispatch('update_inventory');
        setTimeout(() => {
            // needs to be after dispatch in a different "thread"
            if (open_quest_details) {
                updateDetailedQuestDrops();
            }
        });
    }

    interface DropClickEvent {
        detail: {
            data: {
                item : string;
                drop_rate : number;
                quest_id : string;
                quest? : Quest;
            };
        };
    };
    function handleItemClick(event : DropClickEvent) {
        const id = event.detail.data.item;
        const inventory = user.inventory.getAmount(id);
        const required = quest_build_results.required[id] || 0;
        const quest_id = event.detail.data.quest_id;
        const difficulty = questAPI.isEvent(quest_id) ? "Event"
            : questAPI.isVeryHard(quest_id) ? "Very Hard"
            : questAPI.isHard(quest_id) ? "Hard"
            : "Normal";
        edit_inventory_dialog = {
            id,
            inventory,
            drop_rate: event.detail.data.drop_rate,
            required: quest_build_results.required_clean[id] || 0,
            required_missing: calcRequiredMissing(inventory, required),
            priority_required: quest_build_results.priority_amount[id] || 0,
            drop_buff: user.settings.quest.getDropBuff(difficulty),
            commit_changes: true,
        };
        open_item_details = true;
    }

    interface QuestClickEvent {
        detail: {
            data: {
                id : string;
                quest : Quest;
                score: number;
            };
        };
    };
    function handleQuestClick(event : QuestClickEvent) {
        quest_details_dialog = {
            id: event.detail.data.id,
            quest: event.detail.data.quest,
            score: event.detail.data.score,
            drops: [],
        };
        updateDetailedQuestDrops();
        open_quest_details = true;
    }

    interface DetailedQuestDrop {
        item: string; // item id
        drop_rate: number; // drop rate %
        inventory: number; // amount in inventory
        required: number; // result from required_clean
        required_missing: number; // result from (required - inventory)
        priority_required: number; // from priority_amount or whatever
        is_priority: boolean;
        is_disabled: boolean;
    };
    function updateDetailedQuestDrops() {
        const quest_memorypiece = questAPI.memoryPiece(quest_details_dialog.id, user.region.get());
        const quest_drops = questAPI.drops(quest_details_dialog.id, user.region.get());
        const quest_subdrops = questAPI.subdrops(quest_details_dialog.id, user.region.get());
        const drops : DetailedQuestDrop[] = [];
        for (const drop of [...quest_drops, quest_memorypiece, ...quest_subdrops]) {
            if (!drop) {
                // drop is undefined (memory piece, probably)
                continue;
            }
            if (drop.item !== constants.placeholder_id) {
                pushDrop(drop);
            }
        }
        quest_details_dialog = {
            ...quest_details_dialog,
            drops,
        };

        function pushDrop(drop : QuestItem) {
            const inventory = user.inventory.getAmount(drop.item);
            const required_clean = quest_build_results.required_clean[drop.item] || 0;
            drops.push({
                ...drop,
                inventory,
                required: required_clean,
                required_missing: calcRequiredMissing(inventory, required_clean),
                priority_required: quest_build_results.priority_amount[drop.item] || 0,
                is_priority: quest_build_results.priority_items.includes(drop.item),
                is_disabled: quest_build_results.required[drop.item] === undefined,
            });
        }
    }

    function onSettingChanged() {
        setting_changed = true;
    }
</script>

{#if quest_build_results}
    <Dialog bind:open={open} class="text-black z-[1001]" fullscreen
        aria-labelledby="fullscreen-title"
        aria-describedby="fullscreen-content"
    >
        <Header>
            <Title id="fullscreen-title">Quests ({results.length} / {quest_build_results.quest_scores.length})</Title>
            <IconButton class="material-icons" action="close">close</IconButton>
        </Header>
        {#if open}
            <DialogContent id="fullscreen-content">
                {#if results.length <= 0}
                    <div class="flex flex-col justify-center items-center">
                        <strong class="mb-2">No Quests Available</strong>
                        <span class="mb-3">Could not find any quests that contains <strong>required</strong> items.</span>
                        <small class="italic">Make sure you have enabled projects that are <strong>not complete</strong>.</small>
                        <small class="italic">Change your <strong>quest settings</strong> to allow for more quests.</small>
                    </div>
                {:else}
                    {#each results as result (JSON.stringify(result))}
                        <QuestEntry id={result.id} score={result.score} build_results={quest_build_results}
                            on:item_click={(event) => handleItemClick(event)}
                            on:quest_click={(event) => handleQuestClick(event)}
                        />
                    {/each}
                    <InfiniteScroll
                        hasMore={results.length < quest_build_results.quest_scores.length}
                        threshold={100}
                        on:loadMore={() => {addQuests()}}
                    />
                {/if}
            </DialogContent>
        {/if}
        <Actions>
            <IconButton class="material-icons" on:click={() => open_settings = true}>settings</IconButton>
        </Actions>
    </Dialog>
    <!-- quest details dialog -->
    <Dialog bind:open={open_quest_details} class="text-black z-[1002]">
        <!-- z-index needs to be above quest list and below item/inventory editor dialog -->
        {#if open_quest_details}
            <div class="title pl-2 pt-1">Quest Details</div>
            <DialogContent>
                <QuestHeader id={quest_details_dialog.id} quest={quest_details_dialog.quest} score={quest_details_dialog.score} />
                <DataTable table$aria-label="quest item list" style="max-width: 100%; margin-top: 0.5rem;">
                    <Head>
                        <Row>
                            <Cell>Item</Cell>
                            <Cell>Drop Rate</Cell>
                            <Cell>Inventory</Cell>
                            <Cell>Required</Cell>
                            <Cell>Priority Required</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each quest_details_dialog.drops as drop (JSON.stringify(drop))}
                            <Row>
                                <Cell>
                                    <QuestItemButton id={drop.item}
                                        priority={drop.is_priority}
                                        disabled={drop.is_disabled}
                                        on:click={() => handleItemClick({
                                            detail: {
                                                data: {
                                                    item: drop.item,
                                                    drop_rate: drop.drop_rate,
                                                    quest_id: quest_details_dialog.id,
                                                    quest: quest_details_dialog.quest,
                                                },
                                            },
                                        })}
                                    />
                                </Cell>
                                <Cell>
                                    <span class="percentage">{drop.drop_rate}</span>
                                </Cell>
                                <Cell>
                                    <span class="times" class:opacity-50={drop.inventory <= 0}>
                                        {drop.inventory}
                                    </span>
                                </Cell>
                                <Cell>
                                    <span
                                        class:font-extrabold={drop.required_missing > 0}
                                        class:text-red-600={drop.required_missing > 0}
                                        class:opacity-50={drop.required_missing <= 0}
                                    >
                                        {drop.required_missing} / {drop.required}
                                    </span>
                                </Cell>
                                <Cell>
                                    <span class="times" class:opacity-50={drop.priority_required <= 0}>
                                        {drop.priority_required}
                                    </span>
                                </Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            </DialogContent>
        {/if}
        <Actions>
            <Button color="secondary" variant="outlined" class="w-full" action="close">
                <Icon class="material-icons">close</Icon>
                <Label>Close</Label>
            </Button>
        </Actions>
    </Dialog>
    <!-- item/inventory editor dialog -->
    <Dialog bind:open={open_item_details} class="text-black z-[1003]">
        <!-- z-index needs to be above quest list and quest details modal -->
        {#if open_item_details}
            <QuestItemImage id={edit_inventory_dialog.id} height={44} width={44} class="absolute top-1 right-1" />
            <div class="title pl-2 pt-1">Edit Inventory</div>
            <DialogContent>
                <div class="flex flex-col pt-4">
                    <div class="flex flex-row">
                        <strong>Drop Rate</strong>
                        <div class="ml-auto percentage">{edit_inventory_dialog.drop_rate}</div>
                    </div>
                    <div class="flex flex-row">
                        <strong>Required</strong>
                        <div class="ml-auto"
                            class:font-extrabold={edit_inventory_dialog.required_missing > 0}
                            class:text-red-600={edit_inventory_dialog.required_missing > 0}
                        >
                            {edit_inventory_dialog.required_missing} / {edit_inventory_dialog.required}
                        </div>
                    </div>
                    <div class="flex flex-row">
                        <strong>Priority Required</strong>
                        <div class="ml-auto times">{edit_inventory_dialog.priority_required}</div>
                    </div>
                    <Textfield label="Inventory" class="w-full"
                        bind:value={edit_inventory_dialog.inventory}
                        on:keypress={keypressInventoryEdit}
                        on:change={onchangeInventory}
                        type="number" input$min="0" input$max={constants.inventory.max.fragment}>
                        <HelperText slot="helper">
                            Amount in inventory. (max: {constants.inventory.max.fragment})
                        </HelperText>
                    </Textfield>
                    <AmountButtons
                        {...(edit_inventory_dialog.drop_buff > 1) && { extra_options: [edit_inventory_dialog.drop_buff] }}
                        on:add={(e) => addInventory(e.detail.value)}
                        on:subtract={(e) => subInventory(e.detail.value)}
                    />
                </div>
            </DialogContent>
        {/if}
        <Actions>
            <Button color="secondary" variant="outlined" class="w-full" action="close">
                <Icon class="material-icons">close</Icon>
                <Label>Close</Label>
            </Button>
        </Actions>
    </Dialog>
    <!-- settings dialog -->
    <Dialog bind:open={open_settings} class="text-black z-[1002]">
        <!-- z-index needs to be above quest list modal -->
        <DialogContent>
            <QuestSettings bind:filtered_items bind:open_item_filter_dialog
                on:changed={onSettingChanged}
            />
        </DialogContent>
        <Actions>
            <Button color="secondary" variant="outlined" class="w-full" action="close">
                <Icon class="material-icons">close</Icon>
                <Label>Close</Label>
            </Button>
        </Actions>
    </Dialog>
    <Dialog bind:open={open_item_filter_dialog} class="text-black z-[1003]">
        <!-- z-index needs to be above settings dialog -->
        {#if open_item_filter_dialog}
            <DialogContent>
                <ItemCatalog show_fragment
                    on:select_item={(event) => {
                        if (!filtered_items.includes(event.detail.data.id)) {
                            filtered_items.push(event.detail.data.id);
                            user.settings.quest.setItemFilter(filtered_items);
                            filtered_items = filtered_items; // trigger react
                            onSettingChanged();
                        }
                    }}
                />
            </DialogContent>
        {/if}
        <Actions>
            <Button color="secondary" variant="outlined" class="w-full">
                <Icon class="material-icons">close</Icon>
                <Label>Close</Label>
            </Button>
        </Actions>
    </Dialog>
{/if}

<style>
    .title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
    .times::before {
        content: '\00D7';
    }
    .percentage::after {
        content: '%';
    }
</style>