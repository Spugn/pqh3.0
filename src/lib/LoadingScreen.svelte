<script context="module">
    import { onMount } from "svelte";
    import { user, constants } from "./api/api";
    import Select, { Option } from '@smui/select';
    import Button, { Label, Icon } from "@smui/button";
    import { createEventDispatcher } from 'svelte';
</script>

<script lang="ts">
    import type { Language } from "./api/api.d";
    const dispatch = createEventDispatcher();
    export let loading : boolean;
    export let data_read_error : boolean;
    export let show_menu : boolean; // used to hide miyako menu icon because the body class is too slow to be added

    let hide : boolean = false; // if true, slide the loading screen to right
    let deleted : boolean = false; // if true, delete the loading screen
    let pause : boolean = false; // if true, pause to allow user to select game region
    let no_fade : boolean = false; // if true, stop the miyako sprite from fading in and out when state changes
    let setup_region : boolean = false; // if true, consider the region setup as complete (OK to hide loading screen)
    let region_value : Language = "JP";
    const DELAY : number = 2000; // time in milliseconds to wait before loading screen state changes

    onMount(() => {
        // only call this once
        //document.body.classList.add('loading-screen--show'); // opt for show_menu instead

        if (!loading) {
            requestRegion();
        }
    });

    function requestRegion() {
        if (user.region.get() === "UNKNOWN" && !setup_region) {
            setTimeout(() => {
                no_fade = true;
                pause = true;
                setup_region = true;
            }, DELAY);
            return;
        }
        if (setup_region) {
            // region setup complete
            removeScreen();
            return;
        }
        // no need for any pre-setup stuff, just remove screen after delay
        setTimeout(() => {
            removeScreen();
        }, DELAY);
    }

    function removeScreen() {
        // remove class from body and "hide" the loading screen
        // document.body.classList.remove('loading-screen--show'); // opt for show_menu instead
        hide = true;
        loading = false;
        show_menu = true;

        // after 2s, delete the loading screen
        setTimeout(() => {
            deleted = true;
        }, DELAY);
    }
</script>

{#if !deleted}
    <div id="page-loading"
        class:end="{hide}"
        class:data-read-error="{data_read_error}"
        class:pause="{pause}"
    >
        <div id="page-cover"/>
        <div id="loading-div">
            <i id="miyako" class:no-fade="{no_fade}" />
            {#if data_read_error}
                <div id="loading-text">
                    error reading <code>data_location</code>
                </div>
            {/if}
            {#if pause}
                <div id="loading-text" class="bg-white rounded-md p-4 flex flex-col justify-center items-center">
                    <div class="text-black">
                        Select your <strong>Game Region</strong><br />
                        <small class="text-black/60">(this can be changed later in <code class="text-[#D63384]">Settings</code>)</small>
                    </div>
                    <Select bind:value={region_value} label="Game Region">
                        {#each constants.region_options as region}
                            <Option value={region.language}>{region.text}</Option>
                        {/each}
                    </Select>
                    <Button color="primary" variant="raised" class="mt-2"
                        on:click={() => {
                            pause = false;
                            user.region.set(region_value);
                            dispatch("refresh_region");
                            requestRegion();
                        }}
                    >
                        <Icon class="material-icons">done</Icon>
                        <Label>Confirm</Label>
                    </Button>
                </div>
            {/if}
            {#if !data_read_error && !pause && !setup_region}
                <div id="loading-text">
                    Miyako is coming for your pudding.<br/>Please wait...
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    #miyako {
        display: block;
        width: 400px;
        height: 400px;
        opacity: 0;
        background: url("/images/webpage/miyako.png");
        animation: run 750ms steps(19) infinite, start_move 1s forwards;
    }

    #miyako.no-fade {
        animation: run 750ms steps(19) infinite;
        opacity: 1;
    }

    #page-cover {
        background-image: url("/images/webpage/adv_mask_C.png");
        position: fixed;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 1000;
        box-shadow: 4px 0 5px 5px rgba(0, 0, 0, 0.8);
    }

    #loading-div {
        position: fixed;
        top: 40vh;
        left: 50vw;
        transform: translate(-50%, -50%);

        /* #loading-div MUST BE ABOVE #page-cover */
        z-index: 1001;
    }

    #loading-text {
        color: white;
        white-space: nowrap;
        text-align: center;
        animation: fade_in 1s forwards;
    }

    #page-loading.end #page-cover {
        animation: cover_reveal 3s forwards;
    }

    #page-loading.end #loading-div {
        animation: end_move 2750ms forwards;
    }

    #page-loading.data-read-error #miyako {
        background: url("/images/webpage/miyako_death.png");
        animation: death 1000ms steps(18) forwards;
    }

    #page-loading.pause #miyako {
        background: url("/images/webpage/miyako_pudding.png");
        animation: pause 1800ms steps(33) forwards;
    }

    /* MIYAKO INFINITE RUN ANIMATION */
    @keyframes run {
        from {background-position-y: 0;}
        to {background-position-y: -7600px;}
    }

    /* MIYAKO RUN-ONCE DEATH ANIMATION */
    @keyframes death {
        from {background-position-y: 0;}
        to {background-position-y: -7200px;}
        100% {opacity: 1;}
    }

    /* MIYAKO PAUSE (and pudding eat) ANIMATION */
    @keyframes pause {
        from {background-position-y: 0;}
        to {background-position-y: -13200px;}
        0% {opacity: 1;}
        100% {opacity: 1;}
    }

    /* FADE IN MIYAKO */
    @keyframes start_move {
        80% {opacity: 0;}
        100% {opacity: 1;}
    }

    /* FADE IN TEXT */
    @keyframes fade_in {
        0% {opacity: 0;}
        100% {opacity: 100%;}
    }

    /* MOVE LOADING SCREEN BACKGROUND */
    @keyframes cover_reveal {
        from {left: 0;}
        to {left: 200vw;}
        100% {visibility: hidden;}
    }

    /* MOVE MIYAKO AND LOADING TEXT */
    @keyframes end_move {
        from {left: 50vw;}
        to {left: 250vw;}
        100% {visibility: hidden;}
    }
</style>