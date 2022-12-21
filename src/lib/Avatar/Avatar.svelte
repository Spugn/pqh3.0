<script context="module">
    import Image from '$lib/Image.svelte';
    import "./avatar.css";
</script>

<script lang="ts">
    export let avatar : string = "";
    export let type : string = "";
    export let small : boolean = false;
    export let large : boolean = false;
</script>

<span class="avatar" class:avatar-small={small} class:avatar-large={large}>
    <Image img={avatar} type={type} props={{class: "avatar-image"}} />
</span>