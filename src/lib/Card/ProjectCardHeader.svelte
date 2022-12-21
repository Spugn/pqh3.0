<script context="module">
    import Avatar from '$lib/Avatar/Avatar.svelte';
</script>

<script>
    /** @type {string} */
    export let avatar = "999999";

    /** @type {string} */
    export let type = "unit_icon";

    /** @type {string} */
    export let header_text = "";

    /** @type {string} */
    export let title = "";

    /** @type {string} */
    export let subtitle = "";
</script>

<div class="header-root">
    <div class="header-avatar">
        <Avatar avatar={avatar} type={type} />
    </div>
    <div class="header-content">
        <span>{header_text}</span>
        <span>{title}</span>
        <span>{subtitle}</span>
    </div>
    <div class="header-action">
        <slot />
    </div>
</div>

<style>
    .header-root {
        -webkit-box-align: center;
        align-items: center;
        display: flex;
        overflow: hidden;
    }
    .header-avatar {
        display: flex;
        flex: 0 0 auto;
        margin-right: 16px;
    }
    .header-content {
        overflow: hidden;
        flex: 1 1 auto;
    }
    .header-content span {
        margin: 0;
        font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        letter-spacing: 0.01071em;
        display: block;
    }
    .header-content span:nth-child(1) { /** header-text */
        font-weight: bold;
    }
    .header-content span:nth-child(3) { /** subtitle */
        color: rgba(0, 0, 0, 0.6);
    }
    .header-action {
        flex: 0 0 auto;
        align-self: flex-start;
    }
</style>