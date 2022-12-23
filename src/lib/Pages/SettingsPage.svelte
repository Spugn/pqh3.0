<script context="module">
    import Card from '@smui/card';
    import Switch from '@smui/switch';
    import FormField from '@smui/form-field';
    import Button, { Label, Icon } from "@smui/button";
    import Select, { Option } from '@smui/select';
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import ItemCatalog from "$lib/Catalog/ItemCatalog.svelte";
</script>

<script lang="ts">
    import type { Language } from '$lib/api/api.d';
    import { user, constants } from '$lib/api/api';
    import QuestSettings from '$lib/QuestSettings.svelte';

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

    // auto enable projects
    let auto_enable_projects : boolean = user.settings.isAutoEnableProjects();
    $: if (auto_enable_projects !== user.settings.isAutoEnableProjects()) {
        user.settings.setAutoEnableProjects(auto_enable_projects);
    }

    // inventory page - alternative mode
    let inventory_alternative_mode : boolean = user.settings.isInventoryAlternativeMode();
    $: if (inventory_alternative_mode !== user.settings.isInventoryAlternativeMode()) {
        user.settings.setInventoryAlternativeMode(inventory_alternative_mode);
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
    <!-- Quest Settings -->
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