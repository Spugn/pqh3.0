import { user } from "$lib/api/api";

class SessionSort {
    static init : boolean = false;
    static date : "asc" | "desc" = "asc";
    static priority : "desc" | "asc" | "none" = "desc";
    static unit_id : "none" | "asc" | "desc" = "none";
    static type : "none" | "desc" | "asc" = "none";
    static enabled : "none" | "desc" | "asc" = "none";
}

export default (() => {
    function load() {
        if (SessionSort.init) {
            return;
        }
        const project_sort_options = user.settings.getProjectSortOptions();
        if (!project_sort_options) {
            SessionSort.init = true;
            return;
        }
        if (project_sort_options.date) {
            SessionSort.date = project_sort_options.date;
        }
        if (project_sort_options.priority) {
            SessionSort.priority = project_sort_options.priority;
        }
        if (project_sort_options.unit_id) {
            SessionSort.unit_id = project_sort_options.unit_id;
        }
        if (project_sort_options.type) {
            SessionSort.type = project_sort_options.type;
        }
        if (project_sort_options.enabled) {
            SessionSort.enabled = project_sort_options.enabled;
        }
        SessionSort.init = true;
    }

    function save() {
        user.settings.set("project_sort", {
            date: SessionSort.date,
            priority: SessionSort.priority,
            unit_id: SessionSort.unit_id,
            type: SessionSort.type,
            enabled: SessionSort.enabled,
        });
    }

    function getDateSort() {
        return SessionSort.date;
    }

    function changeDateSort() {
        if (SessionSort.date === "asc") {
            SessionSort.date = "desc";
        }
        else {
            SessionSort.date = "asc";
        }
        save();
    }

    function getPrioritySort() {
        return SessionSort.priority;
    }

    function changePrioritySort() {
        if (SessionSort.priority === "desc") {
            SessionSort.priority = "asc";
        }
        else if (SessionSort.priority === "asc") {
            SessionSort.priority = "none";
        }
        else {
            SessionSort.priority = "desc";
        }
        save();
    }

    function getUnitIDSort() {
        return SessionSort.unit_id;
    }

    function changeUnitIDSort() {
        if (SessionSort.unit_id === "none") {
            SessionSort.unit_id = "asc";
        }
        else if (SessionSort.unit_id === "asc") {
            SessionSort.unit_id = "desc";
        }
        else {
            SessionSort.unit_id = "none";
        }
        save();
    }

    function getTypeSort() {
        return SessionSort.type;
    }

    function changeTypeSort() {
        if (SessionSort.type === "none") {
            SessionSort.type = "desc";
        }
        else if (SessionSort.type === "desc") {
            SessionSort.type = "asc";
        }
        else {
            SessionSort.type = "none";
        }
        save();
    }

    function getEnabledSort() {
        return SessionSort.enabled;
    }

    function changeEnabledSort() {
        if (SessionSort.enabled === "none") {
            SessionSort.enabled = "desc";
        }
        else if (SessionSort.enabled === "desc") {
            SessionSort.enabled = "asc";
        }
        else {
            SessionSort.enabled = "none";
        }
        save();
    }

    return {
        load,
        getDateSort,
        changeDateSort,
        getPrioritySort,
        changePrioritySort,
        getUnitIDSort,
        changeUnitIDSort,
        getTypeSort,
        changeTypeSort,
        getEnabledSort,
        changeEnabledSort,
    };
})();