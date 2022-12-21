<script context="module">
    import { character, constants } from '$lib/api/api';
    import { base } from '$app/paths';
    import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
    import Accordion, { Panel, Header, Content } from '@smui-extra/accordion';
    import Image from "$lib/Image.svelte";
</script>

<script lang="ts">
    import type { PageData } from './$types';
    export let data : PageData;

    const id : string = data.page;
    const exists : boolean = character.exists(id);
    interface Names {
        [lang : string] : string;
    };
    const name : Names = character.name(id) as Names;
    interface Equipment {
        [rank : string] : string[];
    }
    const equipment : Equipment = character.equipment(id) as Equipment;
</script>

<svelte:head>
    {#if exists}
        <title>{name.JP} ({id}) | priconne-quest-helper</title>
        <meta name="title" content="{id} | priconne-quest-helper" />
        <meta name="description" content="Character data for {name.JP} ({id})." />
        <meta property="og:title" content="{name.JP} ({id}) | priconne-quest-helper" />
        <meta property="og:description" content="Character data for {name.JP} ({id})." />
        <meta property="og:image" content="https://raw.githubusercontent.com/Spugn/priconne-quest-helper/master/static/images/unit_icon/{id}.png" />
        <meta property="og:url" content="https://spugn.github.io/priconne-quest-helper/characters/{id}" />
        <meta property="twitter:title" content="{name.JP} ({id}) | priconne-quest-helper" />
        <meta property="twitter:description" content="Character data for {name.JP} ({id})." />
    {:else}
        <title>Unknown Character | priconne-quest-helper</title>
        <meta name="title" content="Unknown Character | priconne-quest-helper" />
        <meta name="description" content="Unknown character, invalid character ID provided." />
    {/if}
</svelte:head>

{#if character.exists(data.page)}
    <section>
        <div class="character">
            <div class="header flex flex-col gap-1 items-start">
                <div>
                    <a href="/characters" class="flex flex-row justify-center gap-1"
                        style="color: inherit; text-decoration: none;"
                    >
                        <span class="material-icons">arrow_back</span>
                        <span>back to character list</span>
                    </a>
                </div>
                <div class="flex flex-row items-start gap-2">
                    <div class="thumbnail">
                        <img loading="lazy" src={`${base}/images/unit_icon/${id}.png`}
                            title={`${id}`}
                            alt={`${id}`}
                        />
                    </div>
                    <div class="header-text">
                        <div class="name">{name.JP}</div>
                        <div class="subtitle">{id}</div>
                    </div>
                </div>
            </div>
            <div class="content-wrapper">
                <div class="content flex flex-col w-full items-center gap-3">
                    <div class="flex flex-col w-[90%] gap-1">
                        <div class="section-title">Character Names</div>
                        <DataTable table$aria-label="Name list" style="max-width: 100%;">
                            <Head>
                                <Row>
                                    <Cell>Language</Cell>
                                    <Cell>Name</Cell>
                                </Row>
                            </Head>
                            <Body>
                                {#each Object.keys(name) as lang}
                                    <Row>
                                        <Cell>{lang}</Cell>
                                        <Cell>{name[lang]}</Cell>
                                    </Row>
                                {/each}
                            </Body>
                        </DataTable>
                    </div>
                    <div class="flex flex-col w-[90%] gap-1">
                        <div class="section-title">Equipment</div>
                        <DataTable table$aria-label="Equipment list" style="max-width: 100%;">
                            <Head>
                                <Row>
                                    <Cell>Rank</Cell>
                                    <Cell>Equipment</Cell>
                                </Row>
                            </Head>
                            <Body>
                                {#each Object.keys(equipment) as rank}
                                    <Row>
                                        <Cell>{rank.replace("rank_", "")}</Cell>
                                        <Cell>
                                            <div class="flex flex-row gap-1">
                                                {#each equipment[rank] as id}
                                                    {#if id !== constants.placeholder_id}
                                                        <a href="/items/{id}">
                                                            <Image img={id} type="items" alt={id}
                                                                props={{
                                                                    draggable: false,
                                                                    height: 48,
                                                                    width: 48,
                                                                }}
                                                            />
                                                        </a>
                                                    {:else}
                                                        <Image img={id} type="items" alt={id}
                                                            props={{
                                                                class: "opacity-40",
                                                                draggable: false,
                                                                height: 48,
                                                                width: 48,
                                                            }}
                                                        />
                                                    {/if}
                                                {/each}
                                            </div>
                                        </Cell>
                                    </Row>
                                {/each}
                            </Body>
                        </DataTable>
                    </div>
                    <div class="flex flex-col w-[90%] gap-1">
                        <div class="section-title">Image Assets</div>
                        <Accordion multiple>
                            <Panel>
                                <Header>Unit Icon</Header>
                                <Content>
                                    <Image img={id} type="unit_icon" alt={id} force_png />
                                </Content>
                            </Panel>
                            <Panel>
                                <Header>Unit Still</Header>
                                <Content>
                                    <img loading="lazy" src={`${base}/images/unit_still/${id}.png`} title={id} alt={id} />
                                </Content>
                            </Panel>
                        </Accordion>
                    </div>
                </div>
            </div>
        </div>
        <img loading="lazy" src={`${base}/images/unit_still/${id}.png`}
            title={`still ${id}`}
            alt={`still ${id}`}
            class="still"
        />
        <div class="overlay select-none" />
    </section>
{:else}
    <div>
        character id {data.page} does not exist.
    </div>
    <a href="/characters">back to character index</a>
{/if}

<style>
    div.character {
        z-index: 500;
    }
    div.header {
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 2;
    }
    div.thumbnail {
        width: 100px;
        height: 100px;
    }
    div.header-text {
        color: white;
        text-shadow: 2px 2px 4px #000000;
    }
    div.header-text .name {
        font-weight: 700;
        letter-spacing: 0.2px;
        font-size: 24px;
        color: white;
        white-space: nowrap;
        margin-right: 15px;
    }
    div.header-text .subtitle {
        font-weight: 500;
        letter-spacing: 0.2px;
        font-size: 14px;
        color: rgba(240, 240, 240, 1);
    }
    div.content-wrapper {
        position: fixed;
        bottom: 0;
        width: 100vw;
        max-height: 80vh;
        min-height: 70vh;
        height: calc(90vh - (20vw));
        background-image: url("/images/webpage/adv_mask_C.png");
        border-top-left-radius: 1rem;
        border-top-right-radius: 1rem;
        box-shadow: -25px 0px 5px 3px rgba(0,0,0,0.3);
        z-index: 2;
        padding: 1rem;
    }
    div.content {
        max-height: 70vh;
        overflow-y: auto;
        white-space: pre-line;
        padding-bottom: 8vh;
    }
    div.overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        opacity: 1;
        transition: opacity(0.3);
    }
    img.still {
        min-width: 100%;
        height: auto;
        width: auto;
        position: fixed;
        top: 0;
        left: -100%;
        right: -100%;
        margin: auto;
        z-index: 0; /* below overlay */
        transform: scale(1.5);
        filter: blur(0.5vw);
        transition-property: transform, filter;
        transition-duration: 1s;
        transition-timing-function: ease-out;
    }
    .section-title {
        font-weight: 600;
        letter-spacing: 1px;
        font-size: 1rem;
    }
    @media only screen and (max-width: 1200px) {
        img.still {
            transform: none;
            filter: none;
        }
    }
    @media only screen and (max-width: 300px) {
        img.still {
            transform: scale(3);
            transform-origin: top;
        }
    }
</style>