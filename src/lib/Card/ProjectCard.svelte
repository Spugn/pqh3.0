<script context="module">
    import ProjectCardHeader from "./ProjectCardHeader.svelte";
    import Card, { Content, PrimaryAction, Actions, ActionButtons, ActionIcons, Media, MediaContent } from '@smui/card';
    import IconButton, { Icon } from '@smui/icon-button';
</script>

<script>

</script>

<div class="card-container">
    <Card class="w-[400px] h-[155px]">
        <Content>
            <ProjectCardHeader avatar="100701" header_text="custom name" title="Miyako (100701)" subtitle="cool project bro">
                <IconButton
                    size="mini"
                    class="material-icons"
                    on:click={() => console.log("hello")}
                    title="More options">more_vert</IconButton
                >
            </ProjectCardHeader>
        </Content>
        <Actions>
            test
            <ActionIcons>
                <IconButton
                    class="material-icons"
                    on:click={() => console.log("hello")}
                    title="More options">expand_more</IconButton
                >
            </ActionIcons>
        </Actions>
    </Card>
</div>

<style>
    .card-container {
        display: inline-flex;
        align-items: center;
        min-height: 155px;
        min-width: 400px;
        overflow-x: auto;
        color: #000;
    }
</style>