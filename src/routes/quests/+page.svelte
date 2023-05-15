<script context="module">
    import { constants, quest as questAPI } from "$lib/api/api";
    import { base } from '$app/paths';
    import SegmentedButton, { Segment, Label } from '@smui/segmented-button';
</script>

<script lang="ts">
    interface Result {
        id : string;
        name : string;
        stamina : number;
        memory_piece: {
            exists : boolean;
            item : string;
        };
        drops : QuestItem[];
        subdrops : QuestItem[];
        subdrops_2 : QuestItem[];
    };
    import type { Language, QuestItem } from "$lib/api/api.d";
    let selected : Language = "JP";
    let quest_regions : string[] = Object.keys(questAPI.name("1-1") as object);
    let quests : Result[] = [];

    $: quests = buildQuests(selected);

    function buildQuests(selected : Language) {
        console.log("update", selected);
        let results = [];

        for (const id in questAPI.data) {
            if (!questAPI.existsInRegion(id, selected)) {
                continue;
            }
            const result : Result = {
                id,
                name: questAPI.name(id, selected) as string,
                stamina: questAPI.stamina(id, selected) as number,
                memory_piece: {
                    exists: false,
                    item: "",
                },
                drops: [],
                subdrops: [],
                subdrops_2: [],
            };
            result.drops = questAPI.drops(id, selected);
            result.subdrops = questAPI.subdrops(id, selected);
            result.subdrops_2 = questAPI.subdrops2(id, selected);
            const memory_piece = questAPI.memoryPiece(id, selected);
            if (memory_piece) {
                result.memory_piece.exists = true;
                result.memory_piece.item = memory_piece.item;
                if (questAPI.isEvent(id)) {
                    result.drops = [memory_piece, ...result.drops];
                }
                else {
                    result.drops = [...result.drops, memory_piece];
                }
            }
            results.push(result);
        }
        return results;
    }
</script>


<svelte:head>
	<title>Princess Connect! Re:Dive - Quest Helper | Quest Data</title>
	<meta name="title" content="Princess Connect! Re:Dive - Quest Helper | Quest Data" />
    <meta name="description" content="Quest data used in priconne-quest-helper, a tool for that provides quest choosing assistance and project management for the game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
    <meta property="og:title" content="Princess Connect! Re:Dive - Quest Helper | Quest Data" />
    <meta property="og:description" content="Quest data used in priconne-quest-helper, a tool for that provides quest choosing assistance and project management for the game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
    <meta property="og:image" content="https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/static/logo128.png" />
    <meta property="og:url" content="https://spugn.github.io/priconne-quest-helper/quests/" />
    <meta property="twitter:title" content="Princess Connect! Re:Dive - Quest Helper | Quest Data" />
    <meta property="twitter:description" content="Quest data used in priconne-quest-helper, a tool for that provides quest choosing assistance and project management for the game 'Princess Connect! Re:Dive' （プリンセスコネクト! Re:Dive）." />
</svelte:head>

<div class="color-aliceblue text-center text-shadow-md font-bold py-3.5 mb-3 text-white">
    <h1 class="title text-[5vw] sm:text-3xl">Princess Connect! Re:Dive - Quest Helper</h1>
    <h2 class="title text-[4vw] sm:text-2xl tracking-widest">Quest Data</h2>
    <h1 class="title simple">priconne-quest-helper &boxv; Quest Data</h1>
</div>

<div class="options bg-black/[0.5] w-full">
    <div class="float-right relative bottom-2 right-2">
        <SegmentedButton segments={quest_regions} let:segment singleSelect bind:selected>
            <Segment {segment}>
                <Label>{segment}</Label>
            </Segment>
        </SegmentedButton>
    </div>
</div>
<section class="flex flex-col gap-1 pb-20 sm:px-20">
    {#each quests as quest}
        <div class="bg-black/[0.3] p-4 rounded-md text-white text-shadow-md">
            <div class="mb-2">
                <div class="flex flex-row items-center gap-2 flex-wrap">
                    <div class="flex flex-row justify-center items-center gap-1">
                        <div class="avatar-text select-none">
                            {#if questAPI.isNormal(quest.id)}
                                {quest.id}
                            {/if}
                            {#if questAPI.isHard(quest.id)}
                                {quest.id.replace(constants.difficulty.hard, "")}
                                <span class="text-red-300">{constants.difficulty.hard}</span>
                            {/if}
                            {#if questAPI.isVeryHard(quest.id)}
                                {quest.id.replace(constants.difficulty.very_hard, "")}
                                <span class="text-purple-300">{constants.difficulty.very_hard}</span>
                            {/if}
                            {#if questAPI.isEvent(quest.id)}
                                {quest.id.replace(constants.difficulty.event, "")}
                                <span class="text-yellow-300">{constants.difficulty.event}</span>
                            {/if}
                        </div>
                        {#if quest.memory_piece.exists}
                            <img loading="lazy" src={`${base}/images/items/${quest.memory_piece.item}.png`}
                                width=32 height=32 title="{quest.memory_piece.item}" alt="{quest.memory_piece.item}"
                                draggable="false" class:opacity-50={quest.memory_piece.item === constants.placeholder_id}
                            />
                        {/if}
                    </div>
                    <div class="flex flex-col">
                        <strong>{quest.name}</strong>
                        <span class="text-xs">{quest.stamina} stamina</span>
                    </div>
                </div>
            </div>
            <div>
                <div class="inline-flex flex-row gap-1 mr-[1vw]">
                    {#each quest.drops as drop}
                        <div class="inline-flex flex-col justify-center items-center">
                            <img loading="lazy" src={`${base}/images/items/${drop.item}.png`}
                                width=48 height=48 title="{drop.item}" alt="{drop.item}"
                                draggable="false" class:opacity-50={drop.item === constants.placeholder_id}
                            />
                            <strong class:invisible={drop.drop_rate <= 0}>
                                {drop.drop_rate}%
                            </strong>
                        </div>
                    {/each}
                </div>
                {#if quest.subdrops_2.length > 0}
                    <div class="inline-flex flex-row gap-1 mr-[1vw]">
                        {#each quest.subdrops_2 as drop}
                            <div class="inline-flex flex-col justify-center items-center">
                                <img loading="lazy" src={`${base}/images/items/${drop.item}.png`}
                                    width=48 height=48 title="{drop.item}" alt="{drop.item}"
                                    draggable="false" class:opacity-50={drop.item === constants.placeholder_id}
                                />
                                <strong class:invisible={drop.drop_rate <= 0}>
                                    {drop.drop_rate}%
                                </strong>
                            </div>
                        {/each}
                    </div>
                {/if}
                <div class="inline-flex flex-row gap-1 mr-[1vw]">
                    {#each quest.subdrops as drop}
                        <div class="inline-flex flex-col justify-center items-center">
                            <img loading="lazy" src={`${base}/images/items/${drop.item}.png`}
                                width=48 height=48 title="{drop.item}" alt="{drop.item}"
                                draggable="false" class:opacity-50={drop.item === constants.placeholder_id}
                            />
                            <strong class:invisible={drop.drop_rate <= 0}>
                                {drop.drop_rate}%
                            </strong>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/each}
</section>

<style>
    .options {
        position: fixed;
        bottom: 0;
    }

    .title {
        color: aliceblue;
        text-align: center;
        text-shadow: 2px 2px 4px #000000;
    }
    .title.simple {
        display: none;
        font-size: 4vw;
    }

    .avatar-text {
        font-size: 15px;
        font-weight: bold;
        letter-spacing: 3px;
        color: white;
        text-shadow: 1px 1px 2px #000000,
        1px 1px 2px #000000;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2),
            0 3px 10px 0 rgba(0, 0, 0, 0.19);
        background-color: rgba(0, 0, 0, 0.5);
        padding: 10px 30px;
        border-radius: 5px;
    }

    .text-shadow-md {
        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 4px #000000;
    }


    @media (max-width: 600px) {
        .title:not(.simple) {
            display: none;
        }

        .title.simple {
            display: block;
        }
    }
</style>