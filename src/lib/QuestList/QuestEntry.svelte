<script context="module">
    import { quest as questAPI, user, constants } from "$lib/api/api";
    import QuestHeader from "./QuestHeader.svelte";
    import QuestMainDrops from "./QuestMainDrops.svelte";
    import QuestSubDrops from "./QuestSubDrops.svelte";
    import QuestSubDrops2 from "./QuestSubDrops2.svelte";
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    import type { Quest, QuestBuild2Results } from "$lib/api/api.d";
    export let id : string;
    export let score : number;
    export let build_results : QuestBuild2Results;
    const quest : Quest = questAPI.get(id);
    const gradient : string = constants.quest_card_color.getGradient(score);

    interface DropClickEvent {
        detail: {
            data: {
                item : string;
                drop_rate : number;
            };
        };
    };
    function handleDropClick(event : DropClickEvent) {
        dispatch("item_click", {
            data: {
                ...event.detail.data,
                quest_id: id,
                quest,
            },
        });
    }

    function handleQuestClick() {
        dispatch("quest_click", {
            data: {
                id,
                quest,
                score,
            },
        });
    }
</script>

{#if questAPI.exists(id)}
    <div class={`${gradient} p-4 mb-2 rounded-md`} {...$$restProps}>
        <div class="mb-2">
            <QuestHeader {id} {quest} {score} clickable on:click={handleQuestClick} />
        </div>
        <div>
            <QuestMainDrops {id} {build_results} on:click={handleDropClick}/>
            <QuestSubDrops2 {id} {build_results} on:click={handleDropClick} />
            <QuestSubDrops {id} {build_results} on:click={handleDropClick} />
        </div>
    </div>
{/if}


<style>

</style>