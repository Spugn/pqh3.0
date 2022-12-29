import { equipment as equipmentAPI } from "$lib/api/api";
class SessionSort {
    static rarity : "none" | "desc" | "asc" = "none";
    static amount : "desc" | "asc" = "desc"; // regular mode only
    static fragment : "frag" | "full" = "frag"; // alt mode only
    static rarity_filter : number[];
}

export default (() => {
    function getRaritySort() {
        return SessionSort.rarity;
    }
    function getAmountSort() {
        return SessionSort.amount;
    }
    function getFragmentSort() {
        return SessionSort.fragment;
    }
    function getRarityFilter() {
        if (!SessionSort.rarity_filter) {
            let rarity_filter : number[] = [];
            const rarities = Array(equipmentAPI.getMaxRarity());
            for (let i = 1 ; i <= rarities.length ; i++) {
                rarity_filter.push(i);

            }
            rarity_filter.push(99);
            SessionSort.rarity_filter = rarity_filter;
        }
        return SessionSort.rarity_filter;
    }

    function changeRaritySort() {
        if (SessionSort.rarity === "none") {
            SessionSort.rarity = "desc";
        }
        else if (SessionSort.rarity === "desc") {
            SessionSort.rarity = "asc";
        }
        else {
            SessionSort.rarity = "none";
        }
        return SessionSort.rarity;
    }
    function changeAmountSort() {
        if (SessionSort.amount === "asc") {
            SessionSort.amount = "desc";
        }
        else {
            SessionSort.amount = "asc";
        }
        return SessionSort.amount;
    }
    function changeFragmentSort() {
        if (SessionSort.fragment === "frag") {
            SessionSort.fragment = "full";
        }
        else {
            SessionSort.fragment = "frag";
        }
        return SessionSort.fragment;
    }
    function setRarityFilter(rarity_filter : number[]) {
        SessionSort.rarity_filter = rarity_filter;
    }

    return {
        getRaritySort,
        getAmountSort,
        getFragmentSort,
        getRarityFilter,
        changeRaritySort,
        changeAmountSort,
        changeFragmentSort,
        setRarityFilter,
    };
})();