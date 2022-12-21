<script context="module">
    import Image from '$lib/Item/Image.svelte';
    import "./avatar.css";
</script>

<script lang="ts">
    export let avatars : string[] = [];
</script>

<div class="avatar-group">
    {#each avatars as avatar }
        <span class="avatar">
            <Image id={avatar} props={{class: "avatar-image"}} />
        </span>
    {/each}
</div>

<style>

</style>