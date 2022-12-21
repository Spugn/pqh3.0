<script context="module">
    import QuestItemImage from "./QuestItemImage.svelte";
    import { createEventDispatcher } from 'svelte';
    import { constants } from "$lib/api/api";
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    export let id : string; // item id
    export let priority : boolean = false; // add colored outline
    export let disabled : boolean = false; // reduce opacity and grayscale image
    export let no_pointer : boolean = false; // hide pointer for whatever erason
</script>

<!-- HTML HERE -->
<button on:click={() => dispatch("click")}
    class:no-pointer={no_pointer}
    class="transition-all h-12 w-12 hover:grayscale-0"
    disabled={id === constants.placeholder_id}
    {...$$restProps}
>
    <QuestItemImage {id} {priority} {disabled} />
</button>

<style>
    .no-pointer {
        cursor: default;
    }
    button:not(:disabled):active {
        transform: scale(0.95);
    }
</style>