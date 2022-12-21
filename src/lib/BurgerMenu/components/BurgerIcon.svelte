<script context="module">
    import { styleToString } from '../helpers/utils';
</script>

<script>
    // @ts-nocheck
    export let props = {};

    const c_props = { // component props
        barClassName: "",
        className: "",
        styles: {},
        ...props
    }

    let hover = false;

    function getLineStyle(index) {
        return {
            position: 'absolute',
            height: '20%',
            left: 0,
            right: 0,
            top: 20 * (index * 2) + '%',
            opacity: hover ? 0.6 : 1,
            ...(hover && c_props.styles.bmBurgerBarsHover)
        };
    }

    let buttonStyle = {
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

<div class={`bm-burger-button ${c_props.className}`.trim()}
    style={styleToString({
        ...{ zIndex: 1000 },
        ...c_props.styles.bmBurgerButton,
    })}
>
    <button type="button" id="react-burger-menu-btn"
        on:click={c_props.onClick}
        on:mouseover={() => {
            hover = true;
            if (c_props.onIconHoverChange) {
                c_props.onIconHoverChange({ isMouseIn: true });
            }
        }}
        on:focus
        on:mouseout={() => {
            hover = false;
            if (c_props.onIconHoverChange) {
                c_props.onIconHoverChange({ isMouseIn: false });
            }
        }}
        on:blur
        style={styleToString(buttonStyle)}
    >
        <!-- Open Menu -->
    </button>
    <!-- we're hiding the burger bars anyways in favor of the miyako image
    <span>
        {#each [0, 1, 2] as bar}
            <span class={`bm-burger-bars ${c_props.barClassName} ${hover ? 'bm-burger-bars-hover' : ''}`.trim()}
                style={{
                    ...getLineStyle(bar),
                    ...c_props.styles.bmBurgerBars
                }}
            />
        {/each}
    </span>
    -->
</div>

<style>
.bm-burger-button {
    position: fixed;
    width: 48px;
    height: 48px;
    left: 24px;
    top: 24px;
    opacity: 0.75;
    background: url("/images/webpage/miyako-menu.png");
    background-position-y: 0;
    transition: opacity 0.3s ease-in-out;
    animation: miyako-ghost-bounce 1s infinite;
}

.bm-burger-button:hover {
    animation: miyako-ghost-hover 500ms normal forwards;
    background-position-y: -48px;
    opacity: 1.0;
}

@keyframes miyako-ghost-hover {
    50% {
        transform: rotate(2.5deg) translateY(3px);
    }
    to {
        transform: rotate(-5deg) translateY(-3px);
    }
}

@keyframes miyako-ghost-fade-in {
    0% { opacity: 0; }
    100% { opacity: 0.75; }
}

@keyframes miyako-ghost-bounce {
  0%, 100% {
    transform: translateY(-7%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}
</style>