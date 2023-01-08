<script context="module">
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import Button, { Label, Icon } from "@smui/button";
    import MainPage from '$lib/Pages/MainPage';
</script>

<script lang="ts">
    export let open : boolean = false;
    export let changed : boolean;

    let sort_date = MainPage.getDateSort();
    let sort_priority = MainPage.getPrioritySort();
    let sort_unit_id = MainPage.getUnitIDSort();
    let sort_type = MainPage.getTypeSort();
    let sort_enabled = MainPage.getEnabledSort();

    $: if (open) {
        // update in case sorting was changed in other location
        sort_date = MainPage.getDateSort();
        sort_priority = MainPage.getPrioritySort();
        sort_unit_id = MainPage.getUnitIDSort();
        sort_type = MainPage.getTypeSort();
        sort_enabled = MainPage.getEnabledSort();
    }
</script>

<Dialog bind:open class="text-black z-[1001] select-none">
    <!-- z-index needs to be above miyako menu button (z-index 1000) -->
    <div class="title pl-2 pt-1">Project Sort Options</div>
    <DialogContent class="flex flex-col gap-2">
        <Button color="secondary" class="flex-1 min-h-[36px]" variant="raised"
            on:click={() => {
                MainPage.changeDateSort();
                sort_date = MainPage.getDateSort();
                changed = true;
            }}
        >
            <Icon class="material-icons">
                {sort_date === "asc" ? "arrow_drop_up" : "arrow_drop_down"}
            </Icon>
            <Label>Date</Label>
        </Button>
        <Button color="secondary" class="flex-1 min-h-[36px]" variant="raised"
            on:click={() => {
                MainPage.changePrioritySort();
                sort_priority = MainPage.getPrioritySort();
                changed = true;
            }}
        >
            <Icon class="material-icons">
                {sort_priority === "none"
                    ? "block"
                    : (sort_priority === "desc" ? "arrow_drop_down" : "arrow_drop_up")}
            </Icon>
            <Label>Priority</Label>
        </Button>
        <Button color="secondary" class="flex-1 min-h-[36px]" variant="raised"
            on:click={() => {
                MainPage.changeUnitIDSort();
                sort_unit_id = MainPage.getUnitIDSort();
                changed = true;
            }}
        >
            <Icon class="material-icons">
                {sort_unit_id === "none"
                    ? "block"
                    : (sort_unit_id === "desc" ? "arrow_drop_down" : "arrow_drop_up")}
            </Icon>
            <Label>Unit ID</Label>
        </Button>
        <Button color="secondary" class="flex-1 min-h-[36px]" variant="raised"
            on:click={() => {
                MainPage.changeTypeSort();
                sort_type = MainPage.getTypeSort();
                changed = true;
            }}
        >
            <Icon class="material-icons">
                {sort_type === "none"
                    ? "block"
                    : (sort_type === "desc" ? "arrow_drop_down" : "arrow_drop_up")}
            </Icon>
            <Label>Type</Label>
        </Button>
        <Button color="secondary" class="flex-1 min-h-[36px]" variant="raised"
            on:click={() => {
                MainPage.changeEnabledSort();
                sort_enabled = MainPage.getEnabledSort();
                changed = true;
            }}
        >
            <Icon class="material-icons">
                {sort_enabled === "none"
                    ? "block"
                    : (sort_enabled === "desc" ? "arrow_drop_down" : "arrow_drop_up")}
            </Icon>
            <Label>Enabled</Label>
        </Button>
    </DialogContent>
    <Actions>
        <Button color="secondary" class="flex-1 min-h-[36px]" variant="outlined">
            <Icon class="material-icons">close</Icon>
            <Label>Close</Label>
        </Button>
    </Actions>
</Dialog>

<style>
    .title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
</style>