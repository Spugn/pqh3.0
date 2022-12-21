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
    export let no_pointer : boolean = false; // hide pointer for whatever reason
    export let drop_rate : number = -1;
</script>

<!-- HTML HERE -->
<button on:click={() => dispatch("click")}
    class:no-pointer={no_pointer}
    class="transition-all h-12 w-12 hover:grayscale-0 relative"
    disabled={id === constants.placeholder_id}
    {...$$restProps}
>
    <QuestItemImage {id} {priority} {disabled} />
    <strong class="drop-rate"
        class:invisible={disabled || drop_rate <= -1}
    >
        {drop_rate}%
    </strong>
</button>

<style>
    .no-pointer {
        cursor: default;
    }
    button:not(:disabled):active {
        transform: scale(0.95);
    }
    .drop-rate {
        position: absolute;
        font-family: "Calibri", Arial, serif;
        bottom: -0.25rem;
        right: 0;
        color: white;
        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
    }
</style>