<script context="module">
    import Image from '$lib/Image.svelte';
    import "./avatar.css";
</script>

<script>
    /** @type {string} */
    export let avatar = "";

    /** @type {boolean} */
    export let small = false;

    /** @type {boolean} */
    export let large = false;
</script>

<span class="avatar" class:avatar-small={small} class:avatar-large={large}>
    <Image img={avatar} type="unit_icon" props={{class: "avatar-image"}} />
</span>

<style>

</style>