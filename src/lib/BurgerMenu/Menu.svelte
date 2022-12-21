<script context="module">
    import { base } from '$app/paths';
    import {
        focusOnFirstMenuItem,
        focusOnLastMenuItem,
        focusOnMenuButton,
        focusOnNextMenuItem,
        focusOnPreviousMenuItem
    } from './helpers/dom';
    import BurgerIcon from './components/BurgerIcon.svelte';
    import CrossIcon from './components/CrossIcon.svelte';
    import baseStyles from './helpers/baseStyles';
    import { useEffect, styleToString } from './helpers/utils';
    import Title from './Title.svelte';
    import Footer from './Footer.svelte';
    import { createEventDispatcher } from 'svelte';
</script>

<script>
    // @ts-nocheck
    export let hidden = false;
    export let isOpen;

    let styles = {};
    let props = { // component props
        bodyClassName: '',
        burgerBarClassName: '',
        burgerButtonClassName: '',
        className: '',
        crossButtonClassName: '',
        crossClassName: '',
        disableAutoFocus: false,
        disableCloseOnEsc: false,
        htmlClassName: '',
        id: '',
        itemClassName: '',
        itemListClassName: '',
        menuClassName: '',
        morphShapeClassName: '',
        noOverlay: false,
        noTransition: false,
        onStateChange: () => {},
        outerContainerId: '',
        overlayClassName: '',
        pageWrapId: '',
        styles: {},
        width: 300,
        onIconHoverChange: () => {},
        itemListElement: 'nav',
    };

    const ARROW_DOWN = 'ArrowDown';
    const ARROW_UP = 'ArrowUp';
    const ESCAPE = 'Escape';
    const SPACE = ' ';
    const HOME = 'Home';
    const END = 'End';

    function usePrevious(value) {
        return value;
    }

    let setIsOpen = (value) => { isOpen = value; };
    let timeoutId;
    let toggleOptions = {};
    let prevIsOpenProp = usePrevious(props.isOpen);
    let dispatch = createEventDispatcher();

    // styles (these need to be reactive because if isOpen changes, the styles need to too)
    let s_overlay = "";
    let s_burger_icon = "";
    let s_menu_wrap = "";
    let s_morph_shape = "";
    let s_menu = "";
    let s_item_list = "";
    let s_close_button = "";

    useEffect(() => {
        if (props.isOpen) {
            toggleMenu({ isOpen: true, noStateChange: true });
        }

        return function cleanup() {
            applyWrapperStyles(false);
            clearCurrentTimeout();
        }
    }, () => []);

    useEffect(() => {
        const wasToggled =
            typeof props.isOpen !== 'undefined' &&
            props.isOpen !== isOpen &&
            props.isOpen !== prevIsOpenProp;

        if (wasToggled) {
            toggleMenu();
            // toggling changes SVG animation requirements, so defer these until next update
            return;
        }
    });

    useEffect(() => {
        const { noStateChange, focusOnLastItem } = toggleOptions;
        if (!noStateChange) {
            props.onStateChange({ isOpen });
        }

        if (!props.disableAutoFocus) {
            if (isOpen) {
                focusOnLastItem ? focusOnLastMenuItem() : focusOnFirstMenuItem();
            }
            else {
                if (document.activeElement) {
                    document.activeElement.blur();
                }
                else {
                    document.body.blur(); // needed for IE
                }
            }
        }

        // timeout ensures wrappers are cleared after animation finishes
        clearCurrentTimeout();
        timeoutId = setTimeout(() => {
            timeoutId = null;
            if (!isOpen) {
                applyWrapperStyles(false);
            }
        }, 500);

        // bind keydown handlers (or custom function if supplied)
        const defaultOnKeyDown = isOpen ? onKeyDownOpen : onKeyDownClosed;
        const onKeyDown = props.customOnKeyDown || defaultOnKeyDown;
        window.addEventListener('keydown', onKeyDown);

        // update styles (cus svelte doesn't auto-update them)
        s_overlay = getStyles('overlay');
        s_burger_icon = getStyles('burgerIcon');
        s_menu_wrap = getStyles('menuWrap');
        s_morph_shape = getStyles('morphShape');
        s_menu = getStyles('menu');
        s_item_list = getStyles('itemList');
        s_close_button = getStyles('closeButton');

        return function cleanup() {
            window.removeEventListener('keydown', onKeyDown);
        }
    }, () => [isOpen]);

    function toggleMenu(options = {}) {
        toggleOptions = options;
        applyWrapperStyles();

        // ensure wrapper styles are applied before the menu is toggled
        setTimeout(() => {
            setIsOpen(typeof options.isOpen !== 'undefined' ? options.isOpen : !isOpen);
            dispatch('stateChange', { isOpen });
        });
    }

    function open() {
        if (typeof props.onOpen === 'function') {
            props.onOpen();
        }
        else {
            toggleMenu();
        }
    }

    function close() {
        if (typeof props.onClose === 'function') {
            props.onClose();
        } else {
            toggleMenu();
        }
    }

    function getStyle(style, index) {
        const { width, right } = props;
        const formattedWidth = typeof width !== 'string' ? `${width}px` : width;
        return style(isOpen, formattedWidth, right, index);
    }

    // builds styles incrementally for a given element
    function getStyles(el, index, inline) {
        const propName = `bm${el.replace(el.charAt(0), el.charAt(0).toUpperCase())}`;

        // set base styles
        let output = baseStyles[el] ? getStyle(baseStyles[el]) : {};

        // add animation-specific styles
        if (styles[el]) {
            output = {
                ...output,
                ...getStyle(styles[el], index + 1)
            };
        }

        // add custom styles
        if (props.styles[propName]) {
            output = {
                ...output,
                ...props.styles[propName]
            };
        }

        // add element inline styles
        if (inline) {
            output = {
                ...output,
                ...inline
            };
        }

        // remove transition if required (useful if rendering open initially)
        if (props.noTransition) {
            delete output.transition;
        }

        return styleToString(output);
    }

    // sets or unsets styles on DOM elements outside the menu component
    // this is necessary for correct page interaction with some of the menus
    // throws and returns if the required external elements don't exist,
    // which means any external page animations won't be applied
    function handleExternalWrapper(id, wrapperStyles, set) {
        const wrapper = document.getElementById(id);
        if (!wrapper) {
            console.error(`element with id '${id}' not found`);
            return;
        }

        const builtStyles = getStyle(wrapperStyles);

        for (const prop in builtStyles) {
            if (builtStyles.hasOwnProperty(prop)) {
                wrapper.style[prop] = set ? builtStyles[prop] : '';
            }
        }

        // prevent any horizzontal scroll
        // only set overflow-x as an inline style if htmlClassName or
        // bodyClassName is not passed in. otherwise, it is up to the caller to
        // decide if they want to set the overflow style in CSS using the custom
        // class names
        const applyOverflow = el =>
            (el.style['overflow-x'] = set ? 'hidden' : '');
        if (!props.htmlClassName) {
            applyOverflow(document.querySelector('html'));
        }
        if (!props.bodyClassName) {
            applyOverflow(document.querySelector('body'));
        }
    }

    // applies component-specific styles to external wrapper elements
    function applyWrapperStyles(set = true) {
        const applyClass = (el, className) =>
            el.classList[set ? 'add' : 'remove'](className);

        if (props.htmlClassName) {
            applyClass(document.querySelector('html'), props.htmlClassName);
        }
        if (props.bodyClassName) {
            applyClass(document.querySelector('body'), props.bodyClassName);
        }


        const menuWrap = document.querySelector('.bm-menu-wrap');
        if (menuWrap) {
            if (set) {
                menuWrap.removeAttribute('hidden');
            }
            else {
                menuWrap.setAttribute('hidden', true);
            }
        }
    }

    // avoids potentially attempting to update an unmounted component
    function clearCurrentTimeout() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }

    function onKeyDownOpen(e) {
        e = e || window.event;
        switch(e.key) {
            case ESCAPE:
                // close on ESC, unless disabled
                if (!props.disableCloseOnEsc) {
                    close();
                    focusOnMenuButton();
                }
                break;
            case ARROW_DOWN:
                focusOnNextMenuItem();
                break;
            case ARROW_UP:
                focusOnPreviousMenuItem();
                break;
            case HOME:
                focusOnFirstMenuItem();
                break;
            case END:
                focusOnLastMenuItem();
                break;
        }
    }

    function onKeyDownClosed(e) {
        e = e || window.event;
        // Key downs came from menu button
        if (e.target === document.getElementById('react-burger-menu-btn')) {
            switch (e.key) {
                case ARROW_DOWN:
                case SPACE:
                    // if down arrow, space or enter, open menu and focus on first menuitem
                    toggleMenu();
                    break;
                case ARROW_UP:
                    // if arrow up, open menu and focus on last menuitem
                    toggleMenu({ focusOnLastItem: true });
                    break;
            }
        }
    }

    function handleOverlayClick() {
        if (props.disableOverlayClick === true ||
        (typeof props.disableOverlayClick === 'function') &&
        props.disableOverlayClick()) {
            return;
        }
        else {
            close();
        }
    }
</script>

<div hidden={hidden}>
    {#if !props.noOverlay}
        <div class={`bm-overlay ${props.overlayClassName}`.trim()}
            on:click={handleOverlayClick}
            on:keydown
            on:keyup
            on:keypress
            style={s_overlay}
        />
    {/if}

    <div style={s_burger_icon}>
        <BurgerIcon
            props={{
                onClick: open,
                styles: props.styles,
                customIcon: props.customBurgerIcon,
                className: props.burgerButtonClassName,
                barClassName: props.burgerBarClassName,
                onIconStateChange: props.onIconStateChange,
            }}
        />
    </div>

    <div id={props.id} class={`bm-menu-wrap ${props.className}`.trim()}
        style={s_menu_wrap} aria-hidden={!isOpen}
    >
        {#if styles.svg}
            <div id="bm-morph-shape" class={`bm-morph-shape ${props.morphShapeClassName}`.trim()}
                style={s_morph_shape}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 800"
                    preserveAspectRatio="none"
                >
                    <path d={styles.svg.pathInitial} />
                </svg>
            </div>
        {/if}
        <div class={`bm-menu select-none ${props.menuClassName}`.trim()} style={s_menu}>
            <nav class={`bm-item-list ${props.itemListClassName}`.trim()} style={s_item_list}>
                <!-- children show up here -->
                <Title/>
                <slot />
                <div class="flex flex-col justify-start items-start gap-3">
                    <a href="{base}/characters" target="_blank" class="flex flex-row justify-center items-center"
                        style="color: inherit; text-decoration: none;" rel="noreferrer"
                    >
                        <span class="material-icons">person</span>
                        <span>Character Data</span>
                        <span class="material-icons ml-auto">launch</span>
                    </a>
                    <a href="{base}/items" target="_blank" class="flex flex-row justify-center items-center"
                        style="color: inherit; text-decoration: none;" rel="noreferrer"
                    >
                        <span class="material-icons">inventory_2</span>
                        <span>Item Data</span>
                        <span class="material-icons ml-auto">launch</span>
                    </a>
                    <a href="{base}/quests" target="_blank" class="flex flex-row justify-center items-center"
                        style="color: inherit; text-decoration: none;" rel="noreferrer"
                    >
                        <span class="material-icons">auto_stories</span>
                        <span>Quest Data</span>
                        <span class="material-icons">launch</span>
                    </a>
                    <a href="{base}/statistics" target="_blank" class="flex flex-row justify-center items-center"
                        style="color: inherit; text-decoration: none;" rel="noreferrer"
                    >
                        <span class="material-icons">insights</span>
                        <span>Statistics</span>
                        <span class="material-icons">launch</span>
                    </a>
                    <a href="{base}/data-export" class="flex flex-row justify-center items-center"
                        style="color: inherit; text-decoration: none;"
                    >
                        <span class="material-icons">ios_share</span>
                        <span>Data Export</span>
                        <span class="material-icons">launch</span>
                    </a>
                </div>
                <Footer/>
            </nav>
        </div>

        <div style={s_close_button}>
            <CrossIcon
                props={{
                    onClick: close,
                    styles: props.styles,
                    customIcon: props.customCrossIcon,
                    className: props.closeButtonClassName || "",
                    crossClassName: props.crossClassName || "",
                    isOpen,
                }}
            />
        </div>
    </div>
</div>

<style>

</style>