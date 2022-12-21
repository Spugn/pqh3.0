<script context="module">
    import Image from "$lib/Image.svelte";
    import { character, user } from "$lib/api/api";
</script>

<script lang="ts">
    export let id : string; // unit id
    export let rank : number = -1; // unit rank to display
    export let click : Function | undefined = undefined; // function to call when clicked
    export let ignore_rank : boolean = false; // hide rank and dont grayscale if <= 0

    let unit_name : string;
    $: unit_name = character.name(id, user.region.get()) as string;
</script>

<button on:click={() => { if (click) { click(); } }} {...$$restProps}
    class:no-pointer={!click}
    class="transition-all h-16 w-16 mx-0.5 hover:opacity-100 hover:grayscale-0 select-none"
>
    <Image img={id} type="unit_icon" alt={`${unit_name ? `${unit_name} (${id})` : id}${rank && !ignore_rank ? ` [rank ${rank}]` : ""}`}
        props={{
            draggable: false,
            ...(!ignore_rank && (rank || 0) <= 0) && { "class": "grayscale" },
        }}
    />
    {#if rank && !ignore_rank}
        <div class="rank font-bold text-white text-right text-xl select-none">
            {rank}
        </div>
    {/if}
</button>

<style>
    .rank {
        /**
         * using margins instead of position:relative to reposition because amount text would conflict w/ other buttons
         * e.g. clicking a button below would click a button above
         */
        margin-top: -2rem;
        margin-right: 0.25rem;

        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
    }
    .no-pointer {
        cursor: default;
    }
    button:not(.no-pointer):active {
        transform: scale(0.95);
    }
</style>