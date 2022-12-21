<script context="module">
    import { quest as questAPI, user } from "$lib/api/api";
    import QuestItemButton from "./QuestItemButton.svelte";
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    import type { Language, QuestBuild2Results, QuestItem } from "$lib/api/api.d";
    export let id : string; // quest id
    export let build_results : QuestBuild2Results;
    const language : Language = user.region.get();
    const drops : QuestItem[] = questAPI.drops(id, language);
    const memory_piece : QuestItem | undefined = questAPI.memoryPiece(id, language);
    const required_keys = Object.keys(build_results.required);

    // need to use this instead of `drops` because .push() and .unshift() will cause memory_piece to be duped
    let total_drops : QuestItem[] = [];
    if (memory_piece) {
        if (questAPI.isEvent(id)) {
            // for events, push memory piece to front
            total_drops = [memory_piece, ...drops];
        }
        else {
            // business as usual, push to end
            total_drops = [...drops, memory_piece];
        }
    }
    else {
        // no memory piece
        total_drops = drops;
    }
    function getMissingString(item_id : string) {
        const missing = build_results.required[item_id] || 0;
        if (missing <= 0) {
            return `-`;
        }
        return `${missing}/${build_results.required_clean[item_id] || 0}`;
    }
</script>

<div class="inline-flex flex-row gap-1 mr-[1vw]" {...$$restProps}>
    {#each total_drops as drop}
        {#if drop}
            <div class="inline-flex flex-col justify-center items-center">
                <QuestItemButton id={drop.item}
                    priority={build_results.priority_items.includes(drop.item)}
                    disabled={!required_keys.includes(drop.item)}
                    drop_rate={drop.drop_rate}
                    on:click={() => dispatch("click", { data: drop })}
                />
                <small
                    class="required-amount"
                    class:invisible={!required_keys.includes(drop.item)}
                >
                    {getMissingString(drop.item)}
                </small>
            </div>
        {/if}
    {/each}
</div>

<style>
    .required-amount {
        color: white;
        font-weight: 800;
        font-family: "Calibri", Arial, serif;
        text-shadow: 1px 1px 2px #000000,
            1px 1px 2px #000000,
            1px 1px 4px #000000,
            1px 1px 4px #000000;
    }
</style>