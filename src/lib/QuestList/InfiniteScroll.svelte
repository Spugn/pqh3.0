<script>
    // taken from https://svelte.dev/repl/4863a658f3584b81bbe3d9f54eb67899?version=3.32.3
    // @ts-nocheck - ignoring all
    import { onMount, onDestroy, createEventDispatcher } from "svelte";

    export let threshold = 0;
    export let horizontal = false;
    export let elementScroll = undefined;
    export let hasMore = true;

    const dispatch = createEventDispatcher();
    let isLoadMore = false;
    let component;

    $: {
        if (component || elementScroll) {
            const element = elementScroll ? elementScroll : component.parentNode;

            element.addEventListener("scroll", onScroll);
            element.addEventListener("resize", onScroll);
        }
    }

    const onScroll = e => {
        const element = e.target;

        const offset = horizontal
            ? e.target.scrollWidth - e.target.clientWidth - e.target.scrollLeft
            : e.target.scrollHeight - e.target.clientHeight - e.target.scrollTop;

        if (offset <= threshold) {
            if (!isLoadMore && hasMore) {
                dispatch("loadMore");
            }
            isLoadMore = true;
        } else {
            isLoadMore = false;
        }
    };

    onDestroy(() => {
        if (component || elementScroll) {
            const element = elementScroll ? elementScroll : component.parentNode;

            element.removeEventListener("scroll", null);
            element.removeEventListener("resize", null);
        }
    });
</script>

<div bind:this={component} style="width:0px" />