<script context="module">
    import { quest as questAPI, user, constants } from "$lib/api/api";
    import QuestItemImage from "./QuestItemImage.svelte";
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    import type { Language, QuestItem } from "$lib/api/api.d";
    export let id : string;
    export let score : number;
    export let clickable : boolean = false; // if the quest title should be clickable or not
    const region : Language = user.region.get();
    const name : string = questAPI.name(id, region) as string;
    const stamina : number = questAPI.stamina(id, region) as number;
    const memory_piece : QuestItem | undefined = questAPI.memoryPiece(id, region);
</script>

<div class="flex flex-row items-center gap-2 flex-wrap" {...$$restProps}>
    <div class="flex flex-row justify-center items-center gap-1" on:keydown on:keyup on:keypress
        class:cursor-pointer={clickable}
        class:clickable={clickable}
        on:click={() => {
            if (clickable) {
                dispatch("click");
            }
        }}
    >
        <div class="avatar-text select-none">
            {#if questAPI.isNormal(id)}
                {id}
            {/if}
            {#if questAPI.isHard(id)}
                {id.replace(constants.difficulty.hard, "")}
                <span class="text-red-300">{constants.difficulty.hard}</span>
            {/if}
            {#if questAPI.isVeryHard(id)}
                {id.replace(constants.difficulty.very_hard, "")}
                <span class="text-purple-300">{constants.difficulty.very_hard}</span>
            {/if}
            {#if questAPI.isEvent(id)}
                {id.replace(constants.difficulty.event, "")}
                <span class="text-yellow-300">{constants.difficulty.event}</span>
            {/if}
        </div>
        {#if memory_piece}
            <QuestItemImage id={memory_piece.item} memory_piece />
        {/if}
    </div>
    <div class="flex flex-col">
        <strong>{name}</strong>
        <span class="text-xs">{score} pts • {stamina} stamina</span>
    </div>
</div>

<style>
    .avatar-text {
        font-size: 15px;
        font-weight: bold;
        letter-spacing: 3px;
        color: white;
        text-shadow: 1px 1px 2px #000000,
        1px 1px 2px #000000;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2),
            0 3px 10px 0 rgba(0, 0, 0, 0.19);
        background-color: rgba(0, 0, 0, 0.5);
        padding: 10px 30px;
        border-radius: 5px;
    }

    .clickable:active {
        transform: scale(0.95);
    }
</style>