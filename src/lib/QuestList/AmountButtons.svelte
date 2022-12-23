<script context="module">
    import Button, { Icon, Label } from "@smui/button";
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    export let options : number[] = [10, 5, 1];
    export let extra_options : number[] = [];
    export let ascending : boolean = false;

    options = [...options, ...extra_options].sort((a, b) => {
        if (ascending) {
            return a - b;
        }
        return b - a;
    });
</script>

<div class="flex flex-col gap-1 mt-3" {...$$restProps}>
    <div class="flex flex-row gap-1 w-full">
        <!-- using class doesn't change button style for some reason -->
        {#each options as option (option)}
            <Button color="secondary" variant="outlined" class="flex-1" style="border-color:#2E7D32; color:#2E7D32;"
                on:click={() => dispatch("add", { value: option })}
            >
                <Label>+{option}</Label>
            </Button>
        {/each}
    </div>
    <div class="flex flex-row gap-1 w-full">
        <!-- using class doesn't change button style for some reason -->
        {#each options as option (option)}
            <Button color="secondary" variant="outlined" class="flex-1" style="border-color:#D32F2F; color:#D32F2F;"
                on:click={() => dispatch("subtract", { value: option })}
            >
                <Label>-{option}</Label>
            </Button>
        {/each}
    </div>
</div>