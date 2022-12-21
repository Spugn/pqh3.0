<script context="module">
    import Image from "$lib/Image.svelte";
    import { equipment, user } from "$lib/api/api";
</script>

<script lang="ts">
    export let id : string; // equipment id
    export let amount : number | undefined = undefined; // amount of equipment to display
    export let click : Function | undefined = undefined; // function to call when clicked
    export let ignore_amount : boolean = false; // hide provided amount and don't grayscale if <= 0
    export let props : object = {
        height: 48,
        width: 48,
    };

    let equipment_name : string;
    $: equipment_name = equipment.name(id, user.region.get()) as string;
</script>

<button on:click={() => { if (click) { click(); } }}
        class:no-pointer={!click}
        class="transition-all h-12 w-12 hover:grayscale-0"
        {...$$restProps}
    >
    <Image
        img={id}
        type="items"
        alt={`${equipment_name ? `${equipment_name} (${id})` : id}${amount && !ignore_amount ? ` [x${amount}]` : ""}`}
        props={{
            draggable: false,
            ...props,
            ...(!ignore_amount && (amount || 0) <= 0) && { "class": "grayscale" },
        }}
    />
    {#if amount && !ignore_amount}
        <div class:amount class="font-mono font-bold text-white text-right select-none">
            {amount}
        </div>
    {/if}
</button>

<style>
    .amount {
        /**
         * using margins instead of position:relative to reposition because amount text would conflict w/ other buttons
         * e.g. clicking a button below would click a button above
         */
        margin-top: -1.75rem;
        margin-right: 0.25rem;

        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
    }
    .amount:before {
        content: '\00D7';
    }
    .no-pointer {
        cursor: default;
    }
    button:not(.no-pointer):active {
        transform: scale(0.95);
    }
</style>