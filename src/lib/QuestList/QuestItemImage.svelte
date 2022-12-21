<script context="module">
    import { onMount } from "svelte";
    import { base } from '$app/paths';
    import { equipment, user } from "$lib/api/api";
</script>

<script lang="ts">
    export let id : string; // item id
    export let alt : string = `${equipment.name(id, user.region.get())} (${id})`; // string for alt text
    export let force_png : boolean = false; // force the image to be a png

    export let memory_piece : boolean = false; // item is a memory piece, adjust styling
    export let priority : boolean = false; // item is a priority item, have colored outline
    export let disabled : boolean = false; // item is disabled, lower opacity

    let webp_elem : HTMLSourceElement;
    let png_elem : HTMLImageElement;

    let loaded : boolean = false; // either png or webp loaded
    let failed : boolean = false; // png and webp both failed to load

    onMount(() => {
        const png = `${base}/images/items/${id}.png`;
        const webp = `${base}/images/items_webp/${id}.webp`;
        let webp_failed = false;

        const image = new Image();
        image.src = force_png ? png : webp;
        image.onload = () => {
            loaded = true;
            if (png_elem) { // need this else we'll get uncaught type errors
                png_elem.src = png;
            }
            if (webp_elem) { // need this else we'll get uncaught type errors
                // not changing webp_elem to png path if failed to load webp will keep it on the placeholder webp
                webp_elem.srcset = !force_png && !webp_failed ? webp : png;
            }
        };
        image.onerror = () => {
            if (image.src.indexOf(png) <= -1) {
                // image failed to load, can't find webp? try with png as fallback
                webp_failed = true;
                image.src = png;
            }
            else {
                failed = true;
            }
        };
    });
</script>

<picture>
    <source srcset={`${base}/images/items_webp/999999.webp`} type="image/webp" bind:this={webp_elem} />
    <img loading="lazy" src={`${base}/images/items/999999.png`} bind:this={png_elem}
        title={!loaded ? "loading..." : failed ? `failed to load ${id}` : alt}
        {alt}
        class:inline-block={true}
        class:memory_piece={memory_piece}
        class:priority={priority}
        class:disabled={disabled}
        draggable="false"
        class="dark-shadow-md" {...$$restProps}
    />
</picture>

<style>
    img {
        /*
        width: 6vw;
        height: 6vw;
        max-width: 48px;
        max-height: 48px;
        min-width: 2rem;
        min-height: 2rem;
        margin-right: 0.2vw;
        */
        border-radius: 5px;
    }

    .memory_piece {
        width: 2rem;
        height: 2rem;
        border-radius: 5px;
    }

    .priority {
        outline-style: solid;
        outline-width: 2px;
        outline-color: #ec4899;
    }

    .disabled {
        -webkit-filter: grayscale(100%) opacity(50%); /* Safari 6.0 - 9.0 */
        filter: grayscale(100%) opacity(50%);
        transition: all 0.4s ease-out;
    }

    .disabled:hover {
        -webkit-filter: grayscale(50%) opacity(80%); /* Safari 6.0 - 9.0 */
        filter: grayscale(50%) opacity(80%);
    }
</style>