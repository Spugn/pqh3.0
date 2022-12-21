<script context="module">
    import Image from "$lib/Image.svelte";
</script>

<script lang="ts">
    export let thumbnail : string;
    export let project_type : "character" | string;
    export let priority : boolean;
    export let project_name : string;
    export let subtitle : string;
    export let start_rank : number;
    export let end_rank : number;
    export let progress : number;
</script>

<div class="mini-project-title p-4" {...$$restProps}>
    <div class="flex gap-2 items-center">
        <div class="thumbnail">
            <Image img={thumbnail} type={project_type === "character" ? "unit_icon" : "items"} props={{
                draggable: false,
            }} />
        </div>
        <div class="inline-block">
            <div class="project-name">
                {#if priority}
                    <span style="color: rgb(237, 108, 2);" class="material-icons relative top-[6px]">star</span>
                {/if}
                <span class="name">{project_name}</span>
            </div>
            <div class="subtitle">{subtitle}</div>
        </div>
    </div>
    {#if project_type === "character"}
        <div class="rank">
            Rank {start_rank}
            <span class="material-icons w-6 relative top-[6px]">arrow_right_alt_icon</span>
            Rank {end_rank}
        </div>
    {/if}
    <div class="progress" hidden={progress < 0}>
        Completion {progress}%
    </div>
</div>


<style>
    div.mini-project-title .thumbnail {
        display: inline-block;
        width: 44px;
        height: 44px;
    }

    div.mini-project-title .project-name {
        font-weight: 700;
        letter-spacing: 0.2px;
        font-size: 14px;
        color: rgba(0,0,0,0.8);
        max-width: 200px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    div.mini-project-title .subtitle {
        font-weight: 500;
        letter-spacing: 0.2px;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.4);
    }

    div.mini-project-title .rank {
        letter-spacing: 0.2px;
        font-weight: 500;
        font-size: 14px;
    }

    div.mini-project-title .progress {
        font-weight: 600;
        letter-spacing: 0.2px;
        font-size: 14px;
    }
</style>