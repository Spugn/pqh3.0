<script context="module">
    import { onMount } from "svelte";
    import { base } from '$app/paths';
    import { constants } from "./api/api";
</script>

<script lang="ts">
    export let img : string; // file name without the extension
    export let type : string; // items, characters, webpage, etc
    export let alt : string | undefined = undefined; // string for alt text, defaults to file name if not provided
    export let props : object = {}; // additional props to pass to the img tag
    export let force_png : boolean = false; // force the image to be a png
    export let picture_class : string = "inline-block"; // class string to add to the picture element

    let webp_elem : HTMLSourceElement; // <source> binding, holds webp path usually
    let png_elem : HTMLImageElement; // <img> binding, holds png path usually and styling

    let loaded : boolean = false; // either png or webp loaded
    let failed : boolean = false; // png and webp both failed to load

    onMount(() => {
        const png = `${base}/images/${type}/${img}.png`;
        const webp = `${base}/images/${type}_webp/${img}.webp`;
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

<picture class={picture_class}>
    <source srcset={type !== "webpage" ? `${base}/images/${type}_webp/${constants.placeholder_id}.webp` : undefined} type="image/webp" bind:this={webp_elem} />
    <img loading="lazy" src={type !== "webpage" ? `${base}/images/${type}/${constants.placeholder_id}.png` : undefined} bind:this={png_elem}
        title="{!loaded ? "loading..." : failed ? `failed to load ${type} ${img}` : (alt || img)}"
        alt="{alt || img}" {...props}
    />
</picture>