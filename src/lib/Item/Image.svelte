<script context="module">
    import Image from '$lib/Image.svelte';
    import { equipment, user } from "$lib/api/api";
</script>

<script lang="ts">
    export let id : string; // equipment id

    export let alt : string | undefined = undefined; // alt text, defaults to id if not set

    export let props : object = {};

    let equipment_name : string;
    $: equipment_name = equipment.name(id, user.region.get()) as string;
</script>

<Image
    img={id}
    type="items"
    alt={alt || `${equipment_name} (${id})` || id}
    props={{
        ...props
    }}
/>