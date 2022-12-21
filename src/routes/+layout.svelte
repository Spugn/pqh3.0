<style>
    @import url("../react-burger-menu.css");
    @import url("../smui.css");
    @import url("../app.css"); /** needs to be after smui.css to properly set text/background/etc */
</style>

<main>
    <slot />
</main>

<noscript>
    <div id="loading">
        <i id="miyako-fail"></i>
    </div>
    <h4>
        <span style="color: orangered;">Pudding doesn't taste good without JavaScript...</span><br />
        <span style="color: #e3cfcb;">Princess Connect! Re:Dive Quest Helper</span> can not function without JavaScript.<br />
        <span style="color: #ffdf73;">Please enable JavaScript in your browser to continue.</span>
    </h4>
    <style>
        main {
            display: none;
        }
        h4 {
            text-align: center;
            text-shadow: 1px 1px 3px #000000, 1px 1px 4px #000000;
            background: rgba(0, 0, 0, 0.30);
            padding: 10px 30px;
            border-radius: 6px;
        }
        #loading {
            position: fixed;
            top: 50%;
            left: 51%;
            transform: translate(-50%, -50%);
            margin: auto;
            text-align: center;
            z-index: -1;
        }
        #miyako-fail {
            background: url("/images/webpage/miyako_death.png");
            animation: death 1000ms steps(18) forwards;
            display: block;
            width: 400px;
            height: 400px;
            margin-top: -30vh;
        }
        @keyframes death {
            from {background-position-y: 0;}
            to {background-position-y: -7200px;}
        }
    </style>
</noscript>