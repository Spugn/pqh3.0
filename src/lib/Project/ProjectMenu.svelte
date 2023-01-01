<script context="module">
    import List, { Item, Graphic, Separator, Text, PrimaryText, SecondaryText } from "@smui/list";
    import { createEventDispatcher } from 'svelte';
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
</script>

<script lang="ts">
    import MiniProjectTitle from "./MiniProjectTitle.svelte";

    const dispatch = createEventDispatcher();
    export let open : boolean = false;

    // stuff for MiniProjectTitle
    export let thumbnail : string = "999999";
    export let project_type : "character" | string = "item";
    export let priority : boolean = false;
    export let priority_level : number = 2;
    export let project_name : string = "unknown project";
    export let subtitle : string = "unknown";
    export let start_rank : number = 0;
    export let end_rank : number = 0;
    export let progress : number = 0;

    function startDispatch(dispatch_key : string) {
        open = false;
        dispatch(dispatch_key);
    }
</script>

<Dialog bind:open class="text-black z-[1001] select-none">
    <!-- z-index needs to be above miyako menu button (z-index 1000) -->
    <div class="title pl-2 pt-1">Project Options</div>
    <DialogContent>
        <MiniProjectTitle {thumbnail} {project_type} {priority} {priority_level} {project_name}
            {subtitle} {start_rank} {end_rank} {progress} />
        <List twoLine>
            <Item on:SMUI:action={() => startDispatch("expand")}>
                <Graphic class="material-icons">open_in_full</Graphic>
                <Text>
                    <PrimaryText>Expand</PrimaryText>
                    <SecondaryText>View more project details.</SecondaryText>
                </Text>
            </Item>
            <Item on:SMUI:action={() => startDispatch("edit")}>
                <Graphic class="material-icons">edit</Graphic>
                <Text>
                    <PrimaryText>Edit</PrimaryText>
                    <SecondaryText>Change project details.</SecondaryText>
                </Text>
            </Item>
            <Item on:SMUI:action={() => startDispatch("prioritize")}>
                <Graphic class="material-icons">star</Graphic>
                <Text>
                    <PrimaryText>Edit Priority</PrimaryText>
                    <SecondaryText>
                        Edit project priority status.
                    </SecondaryText>
                </Text>
            </Item>
            {#if project_type === "character"}
                <Item on:SMUI:action={() => startDispatch("partial_complete")}>
                    <Graphic class="material-icons">checklist</Graphic>
                    <Text>
                        <PrimaryText>Partially Complete</PrimaryText>
                        <SecondaryText>Partially complete this project.</SecondaryText>
                    </Text>
                </Item>
            {/if}
            <Item on:SMUI:action={() => startDispatch("complete")}>
                <Graphic class="material-icons">check</Graphic>
                <Text>
                    <PrimaryText>Complete</PrimaryText>
                    <SecondaryText>Complete this project.</SecondaryText>
                </Text>
            </Item>
            <Separator />
            <Item on:SMUI:action={() => startDispatch("delete")}>
                <Graphic class="material-icons">delete</Graphic>
                <Text>
                    <PrimaryText>Delete</PrimaryText>
                    <SecondaryText>Remove this project.</SecondaryText>
                </Text>
            </Item>
        </List>
    </DialogContent>
</Dialog>

<style>
    .title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
</style>