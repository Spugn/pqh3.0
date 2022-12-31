<script context="module">
    import { quest as questAPI, constants } from "$lib/api/api";
    import QuestItemImage from "./QuestItemImage.svelte";
</script>

<script lang="ts">
    import type { Recipe } from "$lib/api/api.d";
    interface QuestResult {
        id: string;
        stamina: number; // quest's stamina cost
        total_stamina: number; // current total stamina consumed at this point
        drops: Recipe; // drop results from this quest
    };
    export let quest_result : QuestResult;
</script>

<div class="flex flex-row items-center gap-1 flex-wrap" {...$$restProps}>
    <div class="avatar-text select-none">
        {#if questAPI.isNormal(quest_result.id)}
            {quest_result.id}
        {/if}
        {#if questAPI.isHard(quest_result.id)}
            {quest_result.id.replace(constants.difficulty.hard, "")}
            <span class="text-red-300">{constants.difficulty.hard}</span>
        {/if}
        {#if questAPI.isVeryHard(quest_result.id)}
            {quest_result.id.replace(constants.difficulty.very_hard, "")}
            <span class="text-purple-300">{constants.difficulty.very_hard}</span>
        {/if}
        {#if questAPI.isEvent(quest_result.id)}
            {quest_result.id.replace(constants.difficulty.event, "")}
            <span class="text-yellow-300">{constants.difficulty.event}</span>
        {/if}
    </div>
    <div class="flex flex-row flex-wrap">
        {#each Object.keys(quest_result.drops) as id}
            <div class="relative">
                <QuestItemImage {id} height={32} width={32} />
                <strong class="amount">
                    {quest_result.drops[id]}
                </strong>
            </div>
        {/each}
    </div>
    <small class="ml-auto">
        {quest_result.total_stamina} stamina (+{quest_result.stamina})
    </small>
</div>

<style>
    .avatar-text {
        font-size: small;
        font-weight: bold;
        color: white;
        text-shadow: 1px 1px 2px #000000,
        1px 1px 2px #000000;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2),
            0 3px 10px 0 rgba(0, 0, 0, 0.19);
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 5px;
        padding: 2px 4px;
    }
    .amount {
        position: absolute;
        font-family: "Calibri", Arial, serif;
        bottom: -0.25rem;
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