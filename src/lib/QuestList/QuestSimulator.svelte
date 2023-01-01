<script context="module">
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import Button, { Icon, Label } from "@smui/button";
    import Select, { Option } from '@smui/select';
    import Checkbox from '@smui/checkbox';
    import FormField from '@smui/form-field';
    import CircularProgress from '@smui/circular-progress';
    import InfiniteScroll from "./InfiniteScroll.svelte";
</script>

<script lang="ts">
    import type { QuestBuild2Results, SessionProjects, QuestSimulatorResults, Recipe } from "$lib/api/api.d";
    import { constants, quest } from '$lib/api/api';
    import QuestItemImage from "./QuestItemImage.svelte";
    import QuestSimulatorEntry from "./QuestSimulatorEntry.svelte";

    export let open : boolean = false;
    export let session_projects : SessionProjects;

    let required_count : number;
    let complete = false;
    let loading = false;

    // settings
    let normal_drop_buff : string = "1";
    let hard_drop_buff : string = "1";
    let very_hard_drop_buff : string = "1";
    let use_inventory : boolean = true;

    let build_results : QuestBuild2Results;
    let simulator_results : QuestSimulatorResults;
    let stamina = {
        days: 0,
        hours: 0,
        minutes: 0,
    };
    interface QuestResult {
        id: string;
        stamina: number; // quest's stamina cost
        total_stamina: number; // current total stamina consumed at this point
        drops: Recipe; // drop results from this quest
    };
    let quests : QuestResult[] = [];
    let new_quests : QuestResult[] = [];
    $: if (open && complete) {
        quests = [
            ...quests,
            ...new_quests,
        ];
    }

    let obtained_drops : string[] = [];

    $: if (open) {
        reset();
    }

    $: updateBuildResults(use_inventory);

    function reset() {
        loading = false;
        complete = false;
        build();
        required_count = Object.keys(build_results.required).length;
    }
    function updateBuildResults(use_inventory : boolean) {
        if (!open) {
            return;
        }
        console.log("updating build result with use_inventory:", use_inventory);
        build();
        required_count = Object.keys(build_results.required).length;
    }
    function build() {
        build_results = quest.build2({ session_projects, use_inventory,
            settings: {
                drop_buff: {
                    "Normal": parseInt(normal_drop_buff),
                    "Hard": parseInt(hard_drop_buff),
                    "Very Hard": parseInt(very_hard_drop_buff),
                },
                sort: {
                    list: true, // descending
                },
            }
        });
    }
    function start() {
        loading = true;
        setTimeout(() => {
            simulator_results = quest.questSimulator(session_projects, {
                normal_drop: parseInt(normal_drop_buff),
                hard_drop: parseInt(hard_drop_buff),
                very_hard_drop: parseInt(very_hard_drop_buff),
                use_inventory,
            }, build_results);
            calc();
            loading = false;
            complete = true;
        }, 100);
    }
    function calc() {
        if (!simulator_results) {
            return;
        }
        // 1 stamina = 6minutes
        const total_minutes = simulator_results.stamina * 6;
        stamina.days = Math.floor((total_minutes / 60) / 24);
        stamina.hours = Math.floor((total_minutes / 60) % 24);
        stamina.minutes = Math.floor(total_minutes % 60);

        // quests
        quests = new_quests = [];
        addQuests();

        // obtained drops
        obtained_drops = Object.keys(simulator_results.total_drops);
        const build_required = Object.keys(build_results.required);
        obtained_drops.sort((a, b) => {
            // display required items first
            return (build_required.includes(b) ? 1 : 0) - (build_required.includes(a) ? 1 : 0);
        });
    }

    function addQuests() {
        new_quests = simulator_results.quests.slice(quests.length, quests.length + 10);
    }
</script>

{#if build_results?.required}
    <Dialog bind:open={open} class="text-black z-[1001]"
        scrimClickAction=""
        escapeKeyAction=""
    >
        <div class="title pl-2 pt-1">Quest Simulator</div>
        <DialogContent>
            {#if !complete && !loading}
                <div class="flex flex-col gap-2">
                    <div class="flex flex-row justify-start items-center gap-4 ml-auto">
                        <div class="text-right">
                            Normal Drop Buff<br />
                            <small class="text-black/60">Increase drops for NORMAL quests.</small>
                        </div>
                        <Select bind:value={normal_drop_buff} label="Normal">
                            {#each constants.drop_buff_options as option}
                                <Option value={option.value}>{option.text}</Option>
                            {/each}
                        </Select>
                    </div>
                    <div class="flex flex-row justify-start items-center gap-4 ml-auto">
                        <div class="text-right">
                            Hard Drop Buff<br />
                            <small class="text-black/60">Increase drops for HARD quests.</small>
                        </div>
                        <Select bind:value={hard_drop_buff} label="Hard">
                            {#each constants.drop_buff_options as option}
                                <Option value={option.value}>{option.text}</Option>
                            {/each}
                        </Select>
                    </div>
                    <div class="flex flex-row justify-start items-center gap-4 ml-auto">
                        <div class="text-right">
                            Very Hard Drop Buff<br />
                            <small class="text-black/60">Increase drops for VERY HARD quests.</small>
                        </div>
                        <Select bind:value={very_hard_drop_buff} label="Very Hard">
                            {#each constants.drop_buff_options as option}
                                <Option value={option.value}>{option.text}</Option>
                            {/each}
                        </Select>
                    </div>
                    <div class="ml-auto">
                        <FormField class="pb-4">
                            <Checkbox bind:checked={use_inventory} />
                            <span slot="label">
                                Use Inventory?<br />
                                <small class="opacity-70">Start with an existing inventory or nothing?</small>
                            </span>
                        </FormField>
                    </div>
                    <div>
                        <small class="text-red-600">
                            <li>All quests will be used regardless of quest settings.</li>
                            <li>Simulator may take a while to complete depending on amount of items.</li>
                        </small>
                    </div>
                    <div class="title pl-2 pt-1">Required Items</div>
                    <div class="max-h-[300px] overflow-auto flex flex-row flex-wrap justify-center items-center gap-1 bg-black/[0.2] rounded-md py-1">
                        {#each Object.keys(build_results.required) as id (id)}
                            <div class="relative">
                                <QuestItemImage {id} height={48} width={48} />
                                <strong class="amount">
                                    {build_results.required[id]}
                                </strong>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
            {#if !complete && loading}
                <div class="flex flex-col justify-center items-center">
                    <CircularProgress style="height: 32px; width: 32px;" indeterminate />
                    <strong>Running Quest Simulator</strong>
                    <small class="italic">please wait...</small>
                    <small class="text-red-600">continue <strong>waiting</strong> if page appears unresponsive.</small>
                </div>
            {/if}
            {#if complete}
                <div class="flex flex-col gap-2">
                    <div class="flex flex-col">
                        <div class="title">{simulator_results.stamina.toLocaleString("en-US")} stamina used</div>
                        {#if stamina.days > 0 || stamina.hours > 0 || stamina.minutes || 0}
                            <small>
                                {#if stamina.days > 0}
                                    <span>{stamina.days.toLocaleString("en-US")} day(s)</span>
                                {/if}
                                {#if stamina.hours > 0}
                                    <span>{stamina.hours} hour(s)</span>
                                {/if}
                                {#if stamina.minutes > 0}
                                    <span>{stamina.minutes} minute(s)</span>
                                {/if}
                                <span>
                                    to <strong>naturally regenerate</strong> the stamina used.
                                </span>
                                <li class="text-red-600">Not including stamina from guild house furniture.</li>
                                <li class="text-red-600">Not including stamina from daily missions.</li>
                                <li class="text-red-600">Not including stamina from refills or other sources.</li>
                            </small>
                        {/if}
                    </div>
                    <div class="flex flex-col">
                        <div class="title">{simulator_results.quests.length} quests completed</div>
                        <div class="max-h-[300px] flex flex-col gap-1 overflow-auto bg-black/[0.2] rounded-md p-1">
                            {#each quests as q (JSON.stringify(q))}
                                <QuestSimulatorEntry quest_result={q} />
                            {/each}
                            <InfiniteScroll
                                hasMore={quests.length < simulator_results.quests.length}
                                threshold={20}
                                on:loadMore={() => addQuests()}
                            />
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="title">Drops Obtained</div>
                        <div class="flex flex-row flex-wrap gap-1 max-h-[300px] overflow-auto bg-black/[0.2] rounded-md p-1">
                            {#each obtained_drops as id (id)}
                                <div class="relative">
                                    <QuestItemImage {id} height={48} width={48} />
                                    <strong class="amount">
                                        {simulator_results.total_drops[id]}
                                    </strong>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}
        </DialogContent>
        {#if !loading}
            <Actions class="flex flex-row gap-1 w-full">
                <Button color="secondary" variant="outlined" class="flex-1" action="close">
                    <Icon class="material-icons">close</Icon>
                    <Label>Close</Label>
                </Button>
                {#if !complete}
                    <Button color="primary" variant="raised" class="flex-1" action=""
                        disabled={required_count <= 0}
                        on:click={start}
                    >
                        <Icon class="material-icons">play_arrow</Icon>
                        <Label>Start</Label>
                    </Button>
                {:else}
                    <Button color="primary" variant="raised" class="flex-1" action=""
                        on:click={reset}
                    >
                        <Icon class="material-icons">replay</Icon>
                        <Label>Reset</Label>
                    </Button>
                {/if}
            </Actions>
        {/if}
    </Dialog>
{/if}

<style>
    .title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
    .amount {
        position: absolute;
        font-family: "Calibri", Arial, serif;
        bottom: -0.25rem;
        right: 0.1rem;
        color: white;
        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
    }
    .amount::before {
        content: '\00D7';
    }
</style>