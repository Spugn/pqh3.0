# BurgerMenu (svelte-burger-menu) by S'pugn

This is a quick rewrite of `react-burger-menu` to be compatible with SvelteKit.

Some features may be cut because I probably won't use them.

This is also not safe for quick plug-and-play because I added a lot of project-specific stuff.

TypeScript is generally ignored in this directory and I won't be implementing tests.

Support the original repository here: <https://github.com/negomi/react-burger-menu>

## Example Usage
```svelte
<!-- index.svelte -->
<script>
    import Menu from '$lib/BurgerMenu/Menu.svelte';
</script>

<Menu props={{
    isOpen: open,
    /** @param {boolean} state */
    onStateChange: (state) => open = state,
}}>
    <!-- your content here -->
    <div class="bm-item">
        <h2>hello world</h2>
    </div>
</Menu>
```