<script context="module">
    import SegmentedButton, { Segment } from '@smui/segmented-button';
    import Slider from '@smui/slider';
    import ItemButton from "$lib/Item/Button.svelte";
    import Chip, { Set, TrailingAction, Text } from '@smui/chips';
    import Button, { Label, Icon } from "@smui/button";
    import ItemImage from "$lib/Item/Image.svelte";
    import Select, { Option } from '@smui/select';
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    import { user, constants, quest as questAPI, equipment as equipmentAPI } from '$lib/api/api';
    const dispatch = createEventDispatcher();
    const waitForFinal = (function () {
        let timers = {};
        // @ts-ignore - old js code idc to figure out types for
        return function (callback, ms, uniqueID) {
            if (!uniqueID) {
                uniqueID = "Don't call this twice without an uniqueID";
            }
            // @ts-ignore - old js code idc to figure out types for
            if (timers[uniqueID]) {
                // @ts-ignore - old js code idc to figure out types for
                clearTimeout(timers[uniqueID]);
            }
            // @ts-ignore - old js code idc to figure out types for
            timers[uniqueID] = setTimeout(callback, ms);
        }
    })();

    // quest sorting - quest list sorting
    let sort_quest_list : string = user.settings.quest.getListSort() ? "Descending" : "Ascending";
    $: if (
        (sort_quest_list === "Descending" && !user.settings.quest.getListSort())
        || (sort_quest_list === "Ascending" && user.settings.quest.getListSort())
    ) {
        user.settings.quest.toggleListSort();
        dispatch("changed");
    }

    // quest sorting - quest score sorting
    let sort_quest_score : string = user.settings.quest.getScoreSort() ? "Ascending" : "Descending";
    $: if (
        (sort_quest_score === "Ascending" && !user.settings.quest.getScoreSort())
        || (sort_quest_score === "Descending" && user.settings.quest.getScoreSort())
    ) {
        user.settings.quest.toggleScoreSort();
        dispatch("changed");
    }

    // event drop buff - normal drop buff
    let normal_drop_buff : string = `${user.settings.quest.getDropBuff("Normal")}`;
    $: if (normal_drop_buff !== `${user.settings.quest.getDropBuff("Normal")}`){
        user.settings.quest.setDropBuff("Normal", parseInt(normal_drop_buff));
        dispatch("changed");
    }

    // event drop buff - hard drop buff
    let hard_drop_buff : string = `${user.settings.quest.getDropBuff("Hard")}`;
    $: if (hard_drop_buff !== `${user.settings.quest.getDropBuff("Hard")}`){
        user.settings.quest.setDropBuff("Hard", parseInt(hard_drop_buff));
        dispatch("changed");
    }

    // event drop buff - very hard drop buff
    let very_hard_drop_buff : string = `${user.settings.quest.getDropBuff("Very Hard")}`;
    $: if (very_hard_drop_buff !== `${user.settings.quest.getDropBuff("Very Hard")}`){
        user.settings.quest.setDropBuff("Very Hard", parseInt(very_hard_drop_buff));
        dispatch("changed");
    }

    // quest range filter
    const quest_range_max : number = questAPI.getMaxChapter();
    let quest_range_start : number = user.settings.quest.getChapterRange()?.min || 1;
    let quest_range_end : number = user.settings.quest.getChapterRange()?.max || questAPI.getMaxChapter();
    $: if (
        quest_range_start !== user.settings.quest.getChapterRange()?.min
        || quest_range_end !== user.settings.quest.getChapterRange()?.max
    ) {
        // need to wait for user to stop moving sliders around, otherwise we'll be saving every time a number changes
        waitForFinal(() => {
            user.settings.quest.setChapterRange(quest_range_start, quest_range_end);
            dispatch("changed");
        }, 500, "quest-range-edit");
    }

    // disabled difficulties
    let disabled_difficulties : string[] = ["Normal", "Hard", "Very Hard", "Event"];
    function forceUpdateDifficulties() {
        disabled_difficulties = disabled_difficulties;
        dispatch("changed");
    }

    // ignored item rarities
    let ignored_rarities : number[] = Array(equipmentAPI.getMaxRarity());
    function forceUpdateIgnoredRarities() {
        ignored_rarities = ignored_rarities;
        dispatch("changed");
    }

    // item filter
    export let filtered_items : string[] = user.settings.quest.getItemFilter();
    export let open_item_filter_dialog : boolean = false;
    function removeFilteredItem() {
        setTimeout(() => { // need to wait for chip to be removed i guess
            user.settings.quest.setItemFilter(filtered_items);
            filtered_items = filtered_items;
            dispatch("changed");
        }, 500);
    }
</script>

<!-- Quest Sorting : List and Score -->
<div class="text-lg font-bold">Quest Sorting</div>
<small class="text-black/60">Determines which quests should be displayed first in the quest list.</small>
<div class="flex flex-col gap-2">
    <div class="flex flex-row justify-start items-center gap-4 ml-auto flex-wrap">
        <div class="text-right">
            Quest List Sorting<br />
            <small class="text-black/60">Sort by quest chapter and number.</small>
        </div>
        <SegmentedButton segments={["Ascending", "Descending"]} let:segment singleSelect bind:selected={sort_quest_list}>
            <Segment {segment}>
                <Label>{segment}</Label>
            </Segment>
        </SegmentedButton>
    </div>
    <div class="flex flex-row justify-start items-center gap-4 ml-auto flex-wrap">
        <div class="text-right">
            Quest Score Sorting<br />
            <small class="text-black/60">Sort by quest score.</small>
        </div>
        <SegmentedButton segments={["Ascending", "Descending"]} let:segment singleSelect bind:selected={sort_quest_score}>
            <Segment {segment}>
                <Label>{segment}</Label>
            </Segment>
        </SegmentedButton>
    </div>
</div>
<!-- Event Drop Buff -->
<hr class="mt-2" />
<div class="text-lg font-bold">Event Drop Buff</div>
<small class="text-black/60">Increase quest value for certain quest difficulties if there's a bonus drop event.</small>
<div class="flex flex-col gap-2">
    <div class="flex flex-row justify-start items-center gap-4 ml-auto flex-wrap">
        <div class="text-right">
            Normal Drop Buff<br />
            <small class="text-black/60">Increase quest scores for NORMAL quests.</small>
        </div>
        <Select bind:value={normal_drop_buff} label="Normal">
            {#each constants.drop_buff_options as option}
                <Option value={option.value}>{option.text}</Option>
            {/each}
        </Select>
    </div>
    <div class="flex flex-row justify-start items-center gap-4 ml-auto flex-wrap">
        <div class="text-right">
            Hard Drop Buff<br />
            <small class="text-black/60">Increase quest scores for HARD quests.</small>
        </div>
        <Select label="Hard" bind:value={hard_drop_buff}>
            {#each constants.drop_buff_options as option}
                <Option value={option.value}>{option.text}</Option>
            {/each}
        </Select>
    </div>
    <div class="flex flex-row justify-start items-center gap-4 ml-auto flex-wrap">
        <div class="text-right">
            Very Hard Drop Buff<br />
            <small class="text-black/60">Increase quest scores for VERY HARD quests.</small>
        </div>
        <Select label="Very Hard" bind:value={very_hard_drop_buff}>
            {#each constants.drop_buff_options as option}
                <Option value={option.value}>{option.text}</Option>
            {/each}
        </Select>
    </div>
</div>
<!-- Quest Range Filter -->
<hr class="mt-2" />
<div class="text-lg font-bold">Quest Range Filter</div>
<small class="text-black/60">Limit the quests that are displayed.</small>
<div class="flex flex-col gap-2">
    <Slider
        range
        bind:start={quest_range_start}
        bind:end={quest_range_end}
        min={1}
        max={quest_range_max}
        step={1}
        discrete
        tickMarks
        input$aria-label="Quest Range Slider"
    />
    <small>Chapter {quest_range_start} - Chapter {quest_range_end}</small>
</div>
<!-- Enabled Quest Difficulties -->
<hr class="mt-2" />
<div class="text-lg font-bold">Enabled Quest Difficulties</div>
<small class="text-black/60">Limit the quest difficulties that are displayed.</small>
<div class="flex flex-col gap-2 mt-2">
    <div class="flex flex-row flex-wrap gap-2">
        {#each disabled_difficulties as difficulty (`${difficulty}-${user.settings.quest.isDisabledDifficulty(difficulty)}`)}
            <Button class="flex-1"
                variant={user.settings.quest.isDisabledDifficulty(difficulty) ? "outlined" : "raised"}
                on:click={() => {
                    user.settings.quest.disableDifficulty(difficulty);
                    forceUpdateDifficulties();
                }}
            >
                <Label>{difficulty}</Label>
            </Button>
        {/each}
    </div>
</div>
<!-- Ignored Item Rarities -->
<hr class="mt-2" />
<div class="text-lg font-bold">Ignored Item Rarities</div>
<small class="text-black/60">Limit the item rarities that are displayed.</small>
<div class="flex flex-col gap-2 mt-2">
    <div class="flex flex-row items-center justify-end gap-1 select-none">
        {#each ignored_rarities as _, i (`${i}-${user.settings.quest.isRarityIgnored(i + 1)}`)}
            <ItemButton id={`99${i + 1}999`} ignore_amount
                click={() => {
                    user.settings.quest.ignoreRarity(i + 1);
                    forceUpdateIgnoredRarities();
                }}
                class={"transition-all h-12 w-12"
                    + (user.settings.quest.isRarityIgnored(i + 1) ? " hover:grayscale-0 grayscale opacity-50 hover:opacity-80" : "")
                }
            />
        {/each}
    </div>
</div>
<!-- Specific Item Filter -->
<hr class="mt-2" />
<div class="flex flex-row">
    <div>
        <div class="text-lg font-bold">Specific Item Filter</div>
        <small class="text-black/60">Filter and display quests with specific items.</small>
    </div>
    {#if filtered_items.length > 0}
        <div class="ml-auto">
            <Button class="mt-4" variant="raised" on:click={() => open_item_filter_dialog = true}>
                <Icon class="material-icons">add</Icon>
                <Label>Add Item</Label>
            </Button>
        </div>
    {/if}
</div>
<div class="flex flex-col gap-2">
    {#if filtered_items.length > 0}
        <Set chips={filtered_items} let:chip key={(chip) => chip} input>
            <Chip {chip}>
                <Text>
                    <ItemImage id={chip} props={{
                        height: 32,
                        width: 32,
                        class: "relative top-1"
                    }} />
                </Text>
                <TrailingAction icon$class="material-icons" on:click={removeFilteredItem}>
                    cancel
                </TrailingAction>
            </Chip>
        </Set>
    {:else}
        <div class="my-4 flex flex-col items-center justify-center gap-2">
            <strong>No filtered items found</strong>
            <small>Add items using the item catalog.</small>
            <Button class="mt-4" variant="raised" on:click={() => open_item_filter_dialog = true}>
                <Icon class="material-icons">add</Icon>
                <Label>Add Item</Label>
            </Button>
        </div>
    {/if}
</div>

<!--
    this dialog needs to be included, but including it here will make it restricted to only
    the container that this QuestSettings component is used in, so easier to exclude it.

    in the parent component that is using QuestSettings, you need to include:
    let open_item_filter_dialog : boolean = false;
    let filtered_items : string[] = user.settings.quest.getItemFilter();

    and bind both variables to QuestSettings
-->
<!--
<Dialog bind:open={open_item_filter_dialog} class="text-black z-[1001]">
    -- z-index needs to be above project contents/overlay/etc --
    {#if open_item_filter_dialog}
        <DialogContent>
            <ItemCatalog show_fragment
                on:select_item={(event) => {
                    if (!filtered_items.includes(event.detail.data.id)) {
                        filtered_items.push(event.detail.data.id);
                        user.settings.quest.setItemFilter(filtered_items);
                        filtered_items = filtered_items; // trigger react
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
-->