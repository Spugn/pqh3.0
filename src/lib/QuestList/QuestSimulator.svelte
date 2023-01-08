<script context="module">
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import Button, { Icon, Label } from "@smui/button";
    import Checkbox from '@smui/checkbox';
    import FormField from '@smui/form-field';
    import CircularProgress from '@smui/circular-progress';
    import InfiniteScroll from "./InfiniteScroll.svelte";
    import IconButton from '@smui/icon-button';
    import QuestSettings from "$lib/QuestSettings.svelte";
    import { user, quest } from '$lib/api/api';
    import QuestItemImage from "./QuestItemImage.svelte";
    import QuestSimulatorEntry from "./QuestSimulatorEntry.svelte";
    import ItemCatalog from "$lib/Catalog/ItemCatalog.svelte";
    import { base } from '$app/paths';
</script>

<script lang="ts">
    import type { QuestBuild2Results, SessionProjects, QuestSimulatorResults, Recipe } from "$lib/api/api.d";

    export let open : boolean = false;
    export let session_projects : SessionProjects;

    let required_count : number;
    let complete = false;
    let loading = false;

    // settings
    let use_inventory : boolean = true;
    let precise : boolean = false;
    let open_settings : boolean = false; // settings dialog
    let open_item_filter_dialog : boolean = false;
    let filtered_items : string[] = user.settings.quest.getItemFilter();
    let setting_changed : boolean = false;
    const stamina_overlay : boolean = user.settings.isSimulatorStaminaOverlay();
    let stamina_overlay_cost : string | undefined = undefined;

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
    $: if ((open && complete) || (open && stamina_overlay)) {
        quests = [
            ...quests,
            ...new_quests,
        ];
    }

    let obtained_drops : string[] = [];

    $: if (open && !stamina_overlay) {
        reset();
    }

    $: updateBuildResults(use_inventory);

    $: if (setting_changed && !open_settings) {
        // a setting was changed and settings dialog was closed. need to rebuild quests
        build();
        setting_changed = false;
    }

    export function updateStaminaOverlay(session_projs : SessionProjects | undefined = undefined) {
        if (!stamina_overlay) {
            return;
        }
        if (!session_projs) {
            session_projs = session_projects;
        }
        simulator_results = quest.questSimulator(session_projs, {
            normal_drop: user.settings.quest.getDropBuff("Normal"),
            hard_drop: user.settings.quest.getDropBuff("Hard"),
            very_hard_drop: user.settings.quest.getDropBuff("Very Hard"),
            use_inventory: !user.settings.isSimulatorDontUseInventory(),
            precise: false, // never use precise mode with stamina overlay
        });
        stamina_overlay_cost = simulator_results.stamina.toLocaleString("en-US");
    }

    function reset() {
        loading = false;
        complete = false;
        build();
    }
    function updateBuildResults(use_inventory : boolean) {
        if (!open || stamina_overlay) {
            return;
        }
        console.log("updating build result with use_inventory:", use_inventory);
        build();
    }
    function build() {
        build_results = quest.build2({ session_projects, use_inventory, settings: user.settings.quest.get() });
        required_count = Object.keys(build_results.required).length;
    }
    function start() {
        if (stamina_overlay) {
            return;
        }
        loading = true;
        setTimeout(() => {
            simulator_results = quest.questSimulator(session_projects, {
                normal_drop: user.settings.quest.getDropBuff("Normal"),
                hard_drop: user.settings.quest.getDropBuff("Hard"),
                very_hard_drop: user.settings.quest.getDropBuff("Very Hard"),
                use_inventory,
                precise,
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
        if (!stamina_overlay) {
            // build_results doesnt exist w/ stamina overlay
            const build_required = Object.keys(build_results.required);
            obtained_drops.sort((a, b) => {
                // display required items first
                return (build_required.includes(b) ? 1 : 0) - (build_required.includes(a) ? 1 : 0);
            });
        }

    }

    function addQuests() {
        new_quests = simulator_results.quests.slice(quests.length, quests.length + 10);
    }

    function onSettingChanged() {
        setting_changed = true;
    }
</script>

{#if stamina_overlay}
    <button class="stamina-overlay flex flex-row items-center gap-2 drop-shadow-md"
        on:click={() => {
            if (!stamina_overlay_cost || stamina_overlay_cost === "0") {
                return;
            }
            calc();
            open = true;
        }}
    >
        <!-- z-index is under any dialogs -->
        <img src="{base}/images/webpage/stamina.png" alt="stamina" style="height:28px;" />
        {#if !stamina_overlay_cost}
            <CircularProgress style="height: 16px; width: 16px;" indeterminate />
        {:else}
            <span>{stamina_overlay_cost}</span>
        {/if}
    </button>
{/if}
{#if build_results?.required || simulator_results}
    <Dialog bind:open={open} class="text-black z-[1001]"
        scrimClickAction=""
        escapeKeyAction=""
    >
        <div class="title pl-2 pt-1">Quest Simulator</div>
        <DialogContent>
            {#if !complete && !loading && !stamina_overlay}
                <div class="flex flex-col gap-2">
                    <div>
                        <FormField class="pb-4">
                            <Checkbox bind:checked={use_inventory} on:click={() => setTimeout(() => updateStaminaOverlay())} />
                            <span slot="label">
                                Use Inventory?<br />
                                <small class="opacity-70">Start with an existing inventory or nothing?</small>
                            </span>
                        </FormField>
                    </div>
                    <div>
                        <FormField class="pb-4">
                            <Checkbox bind:checked={precise} disabled={stamina_overlay} />
                            <span slot="label">
                                Precise Mode<br />
                                <small class="opacity-70">
                                    Run build after every quest loot.<br />
                                    <strong class="text-red-600">(SIMULATOR WILL TAKE LONGER!)</strong>
                                </small>
                            </span>
                        </FormField>
                    </div>
                    <div class="flex flex-row items-center">
                        <FormField class="pb-4">
                            <IconButton class="material-icons" on:click={() => open_settings = true}>settings</IconButton>
                            <span slot="label">
                                Quest Settings<br />
                                <small class="opacity-70">
                                    Settings for quests used in simulation.
                                </small>
                            </span>
                        </FormField>
                    </div>
                    <div>
                        <small class="text-red-600">
                            <li>The quests run depend on quest settings.</li>
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
            {#if complete || stamina_overlay}
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
                {#if !complete && !stamina_overlay}
                    <Button color="primary" variant="raised" class="flex-1" action=""
                        disabled={required_count <= 0}
                        on:click={start}
                    >
                        <Icon class="material-icons">play_arrow</Icon>
                        <Label>Start</Label>
                    </Button>
                {:else if complete}
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
    <!-- settings dialog -->
    <Dialog bind:open={open_settings} class="text-black z-[1002]">
        <!-- z-index needs to be above quest list modal -->
        <DialogContent>
            <QuestSettings bind:filtered_items bind:open_item_filter_dialog on:changed={onSettingChanged} />
        </DialogContent>
        <Actions>
            <Button color="secondary" variant="outlined" class="w-full" action="close">
                <Icon class="material-icons">close</Icon>
                <Label>Close</Label>
            </Button>
        </Actions>
    </Dialog>
    <Dialog bind:open={open_item_filter_dialog} class="text-black z-[1003]">
        <!-- z-index needs to be above settings dialog -->
        {#if open_item_filter_dialog}
            <DialogContent>
                <ItemCatalog show_fragment
                    on:select_item={(event) => {
                        if (!filtered_items.includes(event.detail.data.id)) {
                            filtered_items.push(event.detail.data.id);
                            user.settings.quest.setItemFilter(filtered_items);
                            filtered_items = filtered_items; // trigger react
                            onSettingChanged();
                        }
                    }}
                />
            </DialogContent>
        {/if}
        <Actions>
            <Button color="secondary" variant="outlined" class="w-full">
                <Icon class="material-icons">close</Icon>
                <Label>Close</Label>
            </Button>
        </Actions>
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
    .stamina-overlay {
        position: fixed;
        top: 0.2rem;
        right: 0.2rem;
        font-family: "Open Sans", "Calibri", Arial, serif;
        color: white;
        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
        padding: 0.5rem 1rem;
        background-color: rgba(255, 255, 255, 0.7);
        border-radius: 1rem;
        z-index: 498; /* needs to be below dialogs (usually z-index 500) */
    }
    .stamina-overlay:active {
        transform: scale(0.95);
    }
</style>