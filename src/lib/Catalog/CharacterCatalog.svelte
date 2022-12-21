<script context="module">
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import TextfieldIcon from '@smui/textfield/icon';
    import Button from "$lib/Character/Button.svelte";
    import { character, user } from "$lib/api/api";
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    const dispatch = createEventDispatcher();
    let entries : string[];
    let query : string = "";
    $: entries = character.search(query)
        .filter((v) => (!user.settings.hideContent() || character.existsInRegion(v, user.region.get())));
</script>

<!-- HTML HERE -->
<div class="grid gap-2">
    <div>
        <Textfield bind:value={query} label="Search" class="w-full">
            <TextfieldIcon class="material-icons" slot="leadingIcon">search</TextfieldIcon>
            <HelperText slot="helper">Search for a character name or ID.</HelperText>
        </Textfield>
    </div>
    <div>
        {#if entries.length > 0}
            {#each entries as unit_id (unit_id)}
                <Button id={unit_id} click={() => dispatch("select_character", { data: { id: unit_id } })} ignore_rank />
            {/each}
        {:else}
            <div class="italic select-none">
                no characters found<br />
                <small class="opacity-70">try a different search query</small>
            </div>
        {/if}
    </div>
</div>

<style>

</style>