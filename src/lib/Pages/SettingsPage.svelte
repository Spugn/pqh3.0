<script context="module">
    import Card from '@smui/card';
    import Switch from '@smui/switch';
    import FormField from '@smui/form-field';
    import Button, { Label, Icon } from "@smui/button";
    import Select, { Option } from '@smui/select';
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import ItemCatalog from "$lib/Catalog/ItemCatalog.svelte";
    import { user, constants, equipment } from '$lib/api/api';
    import QuestSettings from '$lib/QuestSettings.svelte';
    import ItemButton from "$lib/Item/Button.svelte";
</script>

<script lang="ts">
    import type { Language, IgnoredRarities } from '$lib/api/api.d';

    // game region
    let region_value : Language = user.region.get();
    $: if (region_value !== user.region.get()) {
        user.region.set(region_value);
    };

    // hide unreleased content
    let hide_unreleased_content : boolean = user.settings.hideContent();
    $: if (hide_unreleased_content !== user.settings.hideContent()) {
        user.settings.setHideContent(hide_unreleased_content);
    };

    // compact project cards
    let compact_project_cards : boolean = user.settings.isCompactProjectCards();
    $: if (compact_project_cards !== user.settings.isCompactProjectCards()) {
        user.settings.setCompactProjectCards(compact_project_cards);
    }

    // auto enable projects
    let auto_enable_projects : boolean = user.settings.isAutoEnableProjects();
    $: if (auto_enable_projects !== user.settings.isAutoEnableProjects()) {
        user.settings.setAutoEnableProjects(auto_enable_projects);
    }

    // keep enabled projects
    let keep_enabled_projects : boolean = user.settings.isKeepEnabledProjects();
    $: if (keep_enabled_projects !== user.settings.isKeepEnabledProjects()) {
        user.settings.setKeepEnabledProjectsEnabledState(keep_enabled_projects);
        console.log(user.settings.getKeepEnabledProjectsEnabledProjects());
    }

    // inventory page - alternative mode
    let inventory_alternative_mode : boolean = user.settings.isInventoryAlternativeMode();
    $: if (inventory_alternative_mode !== user.settings.isInventoryAlternativeMode()) {
        user.settings.setInventoryAlternativeMode(inventory_alternative_mode);
    }

    // quest simulator - stamina overlay
    let simulator_stamina_overlay : boolean = user.settings.isSimulatorStaminaOverlay();
    $: if (simulator_stamina_overlay !== user.settings.isSimulatorStaminaOverlay()) {
        user.settings.setSimulatorStaminaOverlay(simulator_stamina_overlay);
    }

    // quest simulator - stamina overlay - use inventory
    let simulator_dont_use_inventory : boolean = user.settings.isSimulatorDontUseInventory();
    $: if (simulator_dont_use_inventory !== user.settings.isSimulatorDontUseInventory()) {
        user.settings.setSimulatorDontUseInventory(simulator_dont_use_inventory);
    }

    // display all project
    let display_all_project : boolean = user.settings.isDisplayAllProject();
    $: if (display_all_project !== user.settings.isDisplayAllProject()) {
        user.settings.setDisplayAllProject(display_all_project);
    }

    // all project first
    let all_project_first : boolean = user.settings.isAllProjectFirst();
    $: if (all_project_first !== user.settings.isAllProjectFirst()) {
        user.settings.setAllProjectFirst(all_project_first);
    }

    // all project ignored rarities
    let all_project_ignored_rarities : number[] = Array(equipment.getMaxRarity());
    function forceUpdateAllProjectIgnoredRarities() {
        all_project_ignored_rarities = all_project_ignored_rarities;
    }

    // specific item filter
    let open_item_filter_dialog : boolean = false;
    let filtered_items : string[] = user.settings.quest.getItemFilter();
</script>

<section class="flex flex-col gap-2 pb-8 items-center">
    <!-- Game Region -->
    <div class="text-black mx-4 w-[90vw] max-w-[1000px]">
        <Card>
            <div style="padding: 1rem;" class="flex flex-row">
                <div>
                    <h1 class="font-bold text-xl">
                        Game Region
                    </h1>
                    <h3 class="text-black/60">
                        Change character names, equipment names, equipment recipe, and quest drops used.
                    </h3>
                </div>
                <div class="ml-auto">
                    <Select bind:value={region_value} label="Game Region">
                        {#each constants.region_options as region}
                            <Option value={region.language}>{region.text}</Option>
                        {/each}
                    </Select>
                </div>
            </div>
            <p style="padding: 1rem;" class="text-black/70 mb-4">
                <code class="text-[#D63384]">priconne-quest-helper</code> is based off the Japan version of the game,
                but each game region is currently at a different state. This means that equipment costs may be different or
                may use different costs at certain periods of the game. Some quests may have different drop rates as well.
                <strong>Make sure this setting matches your game region so that equipment calculations are as accurate
                as possible.</strong>
                <br /><br />
                If a certain equipment does not exist yet, the current Japanese recipe will be used as a fallback.
            </p>
        </Card>
    </div>
    <!-- Hide Unreleased Content -->
    <div class="text-black mx-4 w-[90vw] max-w-[1000px]">
        <Card>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center">
                <div>
                    <h1 class="font-bold text-xl">
                        Hide Unreleased Content
                    </h1>
                    <h3 class="text-black/60">
                        Avoid showing characters or items that are not available yet.
                    </h3>
                </div>
                <div class="ml-auto">
                    <Switch bind:checked={hide_unreleased_content} />
                </div>
            </div>
            <p style="padding: 1rem;" class="text-black/70 mb-4">
                Enabling this will hide unreleased content from the character and item catalog. Unreleased characters
                or items that are used in projects or that exist in saved data will still be visible. This is only
                useful for non-Japanese regions.
            </p>
        </Card>
    </div>
    <!-- Compact Project Cards -->
    <div class="text-black mx-4 w-[90vw] max-w-[1000px]">
        <Card>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center">
                <div>
                    <h1 class="font-bold text-xl">
                        Compact Project Cards
                    </h1>
                    <h3 class="text-black/60">
                        Reduce the size of project cards to see more in the list.
                    </h3>
                </div>
                <div class="ml-auto">
                    <Switch bind:checked={compact_project_cards} />
                </div>
            </div>
            <p style="padding: 1rem;" class="text-black/70 mb-4">
                Enable this if you prefer not having each individual project be in their own row and would like to see
                more projects on your screen at once.
            </p>
        </Card>
    </div>
    <!-- Auto Enable Projects -->
    <div class="text-black mx-4 w-[90vw] max-w-[1000px]">
        <Card>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center">
                <div>
                    <h1 class="font-bold text-xl">
                        Auto Enable Projects
                    </h1>
                    <h3 class="text-black/60">
                        Enable all projects at startup and project creation.
                    </h3>
                </div>
                <div class="ml-auto">
                    <Switch bind:checked={auto_enable_projects} />
                </div>
            </div>
            <p style="padding: 1rem;" class="text-black/70 mb-4">
                Enable this if you prefer having projects be automatically "Enabled" instead of "Disabled" by default.
                Refresh the webpage after enabling this setting to set all projects as enabled.
            </p>
        </Card>
    </div>
    <!-- Keep Enabled Projects -->
    <div class="text-black mx-4 w-[90vw] max-w-[1000px]">
        <Card>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center">
                <div>
                    <h1 class="font-bold text-xl">
                        Keep Enabled Projects
                    </h1>
                    <h3 class="text-black/60">
                        Remember the state of enabled projects between sessions.
                    </h3>
                </div>
                <div class="ml-auto">
                    <Switch bind:checked={keep_enabled_projects} />
                </div>
            </div>
            <p style="padding: 1rem;" class="text-black/70 mb-4">
                Enable this to remember which projects are enabled and disabled between sessions. If
                "<strong>Auto Enable Projects</strong>" is enabled, then existing projects will no longer automatically
                all be set to enabled or disabled, but newly created projects will continue to be auto set to enabled
                or disabled.
            </p>
        </Card>
    </div>
    <!-- Inventory Page - Alternative Mode -->
    <div class="text-black mx-4 w-[90vw] max-w-[1000px]">
        <Card>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center">
                <div>
                    <h1 class="font-bold text-xl">
                        Inventory Page - Alternative Mode
                    </h1>
                    <h3 class="text-black/60">
                        Change inventory display to have an alternative look.
                    </h3>
                </div>
                <div class="ml-auto">
                    <Switch bind:checked={inventory_alternative_mode} />
                </div>
            </div>
            <p style="padding: 1rem;" class="text-black/70 mb-4">
                Enable this to have items be displayed with an input below them for quick bulk inventory editing.
                Loading the inventory page with this enabled may take longer than usual.
            </p>
        </Card>
    </div>
    <!-- Quest Simulator - Stamina Overlay -->
    <div class="text-black mx-4 w-[90vw] max-w-[1000px]">
        <Card>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center">
                <div>
                    <h1 class="font-bold text-xl">
                        Quest Simulator - Stamina Overlay
                    </h1>
                    <h3 class="text-black/60">
                        Auto-run quest simulator and display stamina used on top right of page.
                    </h3>
                </div>
                <div class="ml-auto">
                    <Switch bind:checked={simulator_stamina_overlay} />
                </div>
            </div>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center">
                <div>
                    <h1 class="font-bold text-xl">
                        Stamina Overlay - Don't Use Inventory
                    </h1>
                    <h3 class="text-black/60">
                        Start with an empty inventory in stamina calculations?
                    </h3>
                </div>
                <div class="ml-auto">
                    <Switch bind:checked={simulator_dont_use_inventory} />
                </div>
            </div>
            <p style="padding: 1rem;" class="text-black/70 mb-4">
                Enable this to auto-run and display quest simulator stamina results on the top right of page.
                Non-precise mode will always be used in stamina calculation.
                If "<strong>Don't Use Inventory</strong>" is enabled, calculations will start with a blank inventory
                rather than an existing inventory.
                <strong class="text-red-600 italic">Webpage may become slow if too many projects are enabled.</strong>
                If this appears to be the case, <strong class="text-red-600">DISABLE</strong> the
                "<strong>Stamina Overlay</strong>"
            </p>
        </Card>
    </div>
    <!-- [All Projects...] Project -->
    <div class="text-black mx-4 w-[90vw] max-w-[1000px]">
        <Card>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center">
                <div>
                    <h1 class="font-bold text-xl">
                        Display [All Projects...] Project
                    </h1>
                    <h3 class="text-black/60">
                        Enable the creation and display of the [All Projects...] project.
                    </h3>
                </div>
                <div class="ml-auto">
                    <Switch bind:checked={display_all_project} />
                </div>
            </div>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center">
                <div>
                    <h1 class="font-bold text-xl">
                        Display [All Projects...] Project First
                    </h1>
                    <h3 class="text-black/60">
                        Display the [All Projects...] project first regardless of sort settings.
                    </h3>
                </div>
                <div class="ml-auto">
                    <Switch bind:checked={all_project_first} />
                </div>
            </div>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center gap-2">
                <div>
                    <h1 class="font-bold text-xl">
                        [All Projects...] Project Ignored Rarities
                    </h1>
                    <h3 class="text-black/60">
                        Modify ignored item rarities in [All Projects...] project.
                    </h3>
                </div>
                <div class="ml-auto">
                    {#each all_project_ignored_rarities as _, i (`${i}-${user.settings.getAllProjectIgnoredRarities()[i + 1]}`)}
                        <ItemButton id={`99${i + 1}999`} ignore_amount
                            click={() => {
                                const ignored_rarities = {
                                    ...user.settings.getAllProjectIgnoredRarities(),
                                    [i + 1]: !(user.settings.getAllProjectIgnoredRarities()[i + 1] || false),
                                };
                                // @ts-ignore - warning about any type but can't add types here
                                if (!ignored_rarities[i + 1]) {
                                    // @ts-ignore - warning about any type but can't add types here
                                    delete ignored_rarities[i + 1];
                                }
                                user.settings.setAllProjectIgnoredRarities(ignored_rarities);
                                forceUpdateAllProjectIgnoredRarities();
                            }}
                            class={"transition-all h-12 w-12"
                                + (user.settings.getAllProjectIgnoredRarities()[i + 1] ? " hover:grayscale-0 grayscale opacity-50 hover:opacity-80" : "")
                            }
                        />
                    {/each}
                </div>
            </div>
            <p style="padding: 1rem;" class="text-black/70 mb-4">
                Enable this to create and display an [All Projects...] project in the project list.
                This project is a compilation of all the required items from every project. It will be displayed when
                there are two or more projects that exist and there is at least one required item.
                The [All Projects...] project can NOT be edited normally like a regular project.<br />
                By default, the [All Projects...] project will be effected by sorting. If you would prefer that it
                appears at the front of the project list at all times, then enable
                "<strong>Display [All Projects...] Project First</strong>".<br />
                <strong class="text-red-600 italic">Webpage may become slow if too many projects exist.</strong>
                If this appears to be the case, <strong class="text-red-600">DISABLE</strong>
                "<strong>Display [All Projects...] Project</strong>"
            </p>
        </Card>
    </div>    <!-- Quest Settings -->
    <div class="text-black mx-4 w-[90vw] max-w-[1000px]">
        <Card>
            <div style="padding: 1rem;" class="flex flex-row mb-2 items-center">
                <div>
                    <h1 class="font-bold text-xl">
                        Quest Settings
                    </h1>
                    <h3 class="text-black/60">
                        Contains quest filter and sorting options. <strong>These settings are also available in the
                        Quest List.</strong>
                    </h3>
                </div>
            </div>
            <div style="padding: 1rem;">
                <hr />
                <QuestSettings bind:filtered_items bind:open_item_filter_dialog />
            </div>
        </Card>
    </div>
    <Dialog bind:open={open_item_filter_dialog} class="text-black z-[1001]">
        <!-- z-index needs to be above project contents/overlay/etc -->
        {#if open_item_filter_dialog}
            <DialogContent>
                <ItemCatalog show_fragment
                    on:select_item={(event) => {
                        if (!filtered_items.includes(event.detail.data.id)) {
                            filtered_items.push(event.detail.data.id);
                            user.settings.quest.setItemFilter(filtered_items);
                            filtered_items = filtered_items; // trigger react
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
</section>

<style>

</style>