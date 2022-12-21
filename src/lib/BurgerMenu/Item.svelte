<script context="module">
    import Image from "$lib/Image.svelte";
</script>

<script>
    /** @type {string} */
    export let page_id;

    /** @type {string} */
    export let current_page;

    /** @type {function | undefined} */
    export let handleMenuClick;

    /** @type {boolean} */
    export let open;
</script>

<!-- HTML HERE -->
<div class="bm-item"
    class:bm-item-current={page_id === current_page}
    on:click={(event) => {
        if (handleMenuClick && page_id !== current_page) {
            handleMenuClick(page_id, event);
            open = false;
        }
    }}
    on:keydown
    on:keyup
    on:keypress
>
    <!-- need to remove <picture> class because "inline-block" scres things up -->
    <Image img={page_id} type="webpage" alt={`${page_id} icon`} picture_class="" force_png={true}
        props={{
            class: "h-[37.61px] float-right relative bottom-[5px]",
            loading: "lazy",
            draggable: false,
        }}
    />
    <span class="cursor-pointer select-none">
        <slot />
    </span>
</div>

<style>

</style>