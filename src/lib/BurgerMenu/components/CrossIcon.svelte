<script context="module">
    import { styleToString } from '../helpers/utils';
</script>

<script>
    // @ts-nocheck
    export let props = {};

    const c_props = { // component props
        crossClassName: "",
        className: "",
        styles: {},
        isOpen: false,
        ...props
    };

    function getCrossStyle(type) {
        return {
            position: 'absolute',
            width: "3px",
            height: "14px",
            transform: type === 'before' ? 'rotate(45deg)' : 'rotate(-45deg)'
        };
    }
    const buttonWrapperStyle = {
        position: 'absolute',
        width: "24px",
        height: "24px",
        right: "8px",
        top: "8px"
    };
    const buttonStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      zIndex: 1,
      width: '100%',
      height: '100%',
      margin: 0,
      padding: 0,
      border: 'none',
      fontSize: 0,
      background: 'transparent',
      cursor: 'pointer'
    };
</script>

<div class={`bm-cross-button ${c_props.className}`.trim()}
    style={styleToString({
        ...buttonWrapperStyle,
        ...c_props.styles.bmCrossButton,
    })}
>
    <button type="button" id="react-burger-cross-btn" on:click={c_props.onClick}
        style={styleToString(buttonStyle)} tabindex={c_props.isOpen ? 0 : -1}
    >
        Close Menu
    </button>
    <span style={styleToString({
        position: 'absolute',
        top: '6px',
        right: '14px',
    })}
    >
        {#each ["before", "after"] as type}
            <span class={`bm-cross ${c_props.crossClassName}`.trim()}
                style={styleToString({
                    ...getCrossStyle(type),
                    ...c_props.styles.bmCross,
                })}
            />
        {/each}
    </span>
</div>

<style>

</style>