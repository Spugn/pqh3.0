<script context="module">
    import Tooltip, { Wrapper, Title, Content } from "@smui/tooltip";
    import Image from "$lib/Item/Image.svelte";
    import { constants } from "$lib/api/api";
</script>

<script lang="ts">
    import type { RankDetails } from "$lib/api/api.d";
    export let start : RankDetails;
    export let end : RankDetails;
</script>

<div style="display: flex; flex-wrap: wrap; align-items: center;" {...$$restProps}>
    <Wrapper>
        <span>Rank {start.rank}</span>
        <Tooltip>
            <Title>Rank {start.rank}</Title>
            <Content>
                <Image id={constants.placeholder_id} props={{
                    height: 48,
                    width: 48,
                    //class: (equipped ? "" : "opacity-50 grayscale"),
                    style: "border-radius: 4px;",
                }} />
            </Content>
        </Tooltip>
    </Wrapper>
    <span class="material-icons w-6 relative top-[6px]">arrow_right_alt_icon</span>
    <Wrapper rich>
        <span>Rank {end.rank}</span>
        <Tooltip>
            <Content>
                {end.equipment}
            </Content>
        </Tooltip>
    </Wrapper>
</div>

<style>

</style>