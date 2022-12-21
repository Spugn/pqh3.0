<script context="module">
    import { quest as questAPI, user } from "$lib/api/api";
    import QuestItemButton from "./QuestItemButton.svelte";
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    import type { Language, QuestBuild2Results, QuestItem } from "$lib/api/api.d";
    export let id : string;
    export let build_results : QuestBuild2Results;
    const language : Language = user.region.get();
    const subdrops : QuestItem[] = questAPI.subdrops(id, language);
    const required_keys = Object.keys(build_results.required);
</script>

<div class="inline-flex flex-row gap-1 mr-[1vw]" {...$$restProps}>
    {#each subdrops as drop}
        <div class="inline-flex flex-col justify-center items-center">
            <QuestItemButton id={drop.item}
                priority={build_results.priority_items.includes(drop.item)}
                disabled={!required_keys.includes(drop.item)}
                on:click={() => dispatch("click", { data: drop })}
            />
            <strong class:invisible={!required_keys.includes(drop.item)}>
                {drop.drop_rate}%
            </strong>
        </div>
    {/each}
</div>