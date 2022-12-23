<script lang="ts">
    export let amount : number = 3;
</script>

<span class="inline-block relative select-none" {...$$restProps}>
    <span style="color: rgb(237, 108, 2);" class="material-icons relative top-[6px]">star</span>
    <span class="amount"
        class:invisible={amount <= 2}
        class:single={amount < 10}
        class:double={amount >= 10}
    >
        {amount}
    </span>
</span>

<style>
    .amount {
        color: white;
        position: absolute;
        font-weight: 800;
        font-family: "Calibri", Arial, serif;
        text-shadow: 1px 1px 4px #000000,
            1px 1px 4px #000000,
            1px 1px 2px #000000,
            1px 1px 2px #000000;
        font-size: smaller;
        text-align: right;
    }
    .amount.single {
        bottom: -0.3rem;
        right: 0.05rem;
    }
    .amount.double {
        bottom: -0.3rem;
        right: -0.1rem;
    }
</style>