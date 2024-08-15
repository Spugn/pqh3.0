<script context="module">
    import Button, { Label, Icon } from "@smui/button";
    import { user, quest as questAPI } from "$lib/api/api";
    import Image from "$lib/Image.svelte";
    import Project from "$lib/Project/Project.svelte";
    import ProjectCreator from '$lib/ProjectBuilder/ProjectCreator.svelte';
    import { onMount } from "svelte";
    import ProjectEditor from "$lib/ProjectBuilder/ProjectEditor.svelte";
    import QuestList from '$lib/QuestList/QuestList.svelte';
    import QuestSimulator from '$lib/QuestList/QuestSimulator.svelte';
    import ProjectSortOptions from "$lib/Project/ProjectSortOptions.svelte";
    import MainPage from "./MainPage";
</script>

<script lang="ts">
    import type { CharacterProject, ItemProject, BasicProject, QuestBuild2Results,
        SessionProjects, Recipe } from '$lib/api/api.d';
    import Card from "@smui/card";

    export let show_menu : boolean;
    let project_displayed : boolean = false; // flag for if a project is expanded. if so, hide non-expanded projects
    let _inventory_string = JSON.stringify(user.inventory.get()); // used as a global indicator for if a project should update due to inventory changes
    let session_projects : SessionProjects = {}; // used to store enabled/disabled projects and their data
    let _project_keys : string[] = []; // sorted list of keys for the project list
    let open_project_creator : boolean = false;
    let open_project_editor : boolean = false;
    let open_quest_list : boolean = false;
    let open_quest_simulator : boolean = false;
    let project_editor_project : number = -1;
    let built_quests : QuestBuild2Results;
    let compact_projects : boolean = user.settings.isCompactProjectCards();
    let quest_simulator : QuestSimulator;
    let hide_simulator_button : boolean = user.settings.isSimulatorStaminaOverlay();
    let open_sort_options : boolean = false;
    let sort_options_changed : boolean = false;

    $: if (!open_sort_options && sort_options_changed) {
        _project_keys = sortProjects();
        sort_options_changed = false;
    }

    onMount(async () => {
        session_projects = user.getSessionProjects();
        buildProjects();
        _project_keys = sortProjects();
    });

    function buildProjects() {
        const user_projects = user.projects.get();
        const required_all : Recipe = {};
        for (const project_id in user_projects) {
            if (!session_projects[project_id]) {
                // init project as session project
                session_projects[project_id] = {
                    enabled: user.settings.isAutoEnableProjects() ? true : false,
                    edited: user_projects[project_id].date as number,
                    project: user_projects[project_id],
                };
                if (user.settings.isKeepEnabledProjects()) {
                    const keep_enabled_projects = user.settings.getKeepEnabledProjectsEnabledProjects();
                    session_projects[project_id].enabled = keep_enabled_projects[project_id];
                }
            }
            else {
                // update project data and keep enabled/disabled status
                session_projects[project_id] = {
                    ...session_projects[project_id],
                    project: user_projects[project_id],
                }
            }
            if (user.settings.isDisplayAllProject()) {
                for (const item in user_projects[project_id].required) {
                    required_all[item] = (required_all[item] || 0) + user_projects[project_id].required[item];
                }
            }
        }
        // create "All Project"
        const all_projects_key = "all_projects";
        if (user.settings.isDisplayAllProject()
            && Object.keys(user_projects).length >= 2 // there are at least 2 user projects
            && Object.keys(required_all).length > 0 // there are at least some required items
        ) {
            if (!session_projects[all_projects_key]) {
                // doesn't exist, create
                session_projects[all_projects_key] = {
                    enabled: false, // always disabled by default
                    edited: Date.now(),
                    project: {
                        type: "item",
                        date: Date.now(),
                        priority: false,
                        all_item_project: true,
                        details: {
                            name: "[All Projects...]",
                            ignored_rarities: user.settings.getAllProjectIgnoredRarities(),
                        },
                        required: required_all,
                    } as ItemProject,
                };
            }
            else if (
                JSON.stringify(session_projects[all_projects_key].project.required) !== JSON.stringify(required_all)
                || JSON.stringify(user.settings.getAllProjectIgnoredRarities())
                    !== JSON.stringify(session_projects[all_projects_key].project.details?.ignored_rarities)
            ) {
                // update project data and keep enabled/disabled status
                const current_date = Date.now();
                session_projects[all_projects_key] = {
                    ...session_projects[all_projects_key],
                    edited: current_date,
                    project: {
                        ...session_projects[all_projects_key].project,
                        date: current_date,
                        details: {
                            ...session_projects[all_projects_key].project.details,
                            ignored_rarities: user.settings.getAllProjectIgnoredRarities(),
                        },
                        required: required_all,
                    },
                }
            }
        }
        else if (session_projects[all_projects_key]) {
            delete session_projects[all_projects_key];
        }
        session_projects = session_projects; // force reaction
        buildQuests();
    }

    function sortProjects() {
        MainPage.load(); // load settings if not loaded yet
        // sorting by priority or not, could do something more like sort by completion but kinda lazy
        // and also having to sort every time may be time consuming, idk
        let result = Object.keys(session_projects);
        // date sort
        result.sort((a, b) => {
            function getSortValue(project : CharacterProject | ItemProject | BasicProject) : number {
                if ((project as ItemProject).all_item_project) {
                    return -1;
                }
                return project.date as number || 0;
            }
            if (MainPage.getDateSort() === "desc") {
                return getSortValue(session_projects[b].project) - getSortValue(session_projects[a].project);
            }
            else {
                return getSortValue(session_projects[a].project) - getSortValue(session_projects[b].project);
            }
        });
        // rarity sort
        if (MainPage.getPrioritySort() !== "none") {
            result.sort((a, b) => {
                function getSortValue(project : CharacterProject | ItemProject | BasicProject) : number {
                    if (!project.priority) {
                        return 0;
                    }
                    return 1000 + (project.details?.priority_level || 2);
                }
                if (MainPage.getPrioritySort() === "desc") {
                    return getSortValue(session_projects[b].project) - getSortValue(session_projects[a].project);
                }
                else {
                    return getSortValue(session_projects[a].project) - getSortValue(session_projects[b].project);
                }
            });
        }
        // unit id sort
        if (MainPage.getUnitIDSort() !== "none") {
            result.sort((a, b) => {
                function getSortValue(project : CharacterProject | ItemProject | BasicProject) : number {
                    if (project.type !== "character") {
                        // make sure non character projects appear on bottom
                        return MainPage.getUnitIDSort() === "desc" ? 0 : Number.MAX_VALUE;
                    }
                    return parseInt((project as CharacterProject).details?.avatar_id) || 0;
                }
                if (MainPage.getUnitIDSort() === "desc") {
                    return getSortValue(session_projects[b].project) - getSortValue(session_projects[a].project);
                }
                else {
                    return getSortValue(session_projects[a].project) - getSortValue(session_projects[b].project);
                }
            });
        }
        // type sort
        if (MainPage.getTypeSort() !== "none") {
            result.sort((a, b) => {
                function getSortValue(project : CharacterProject | ItemProject | BasicProject) : number {
                    if (project.type !== "character") {
                        return 0;
                    }
                    return 1;
                }
                if (MainPage.getTypeSort() === "desc") {
                    return getSortValue(session_projects[b].project) - getSortValue(session_projects[a].project);
                }
                else {
                    return getSortValue(session_projects[a].project) - getSortValue(session_projects[b].project);
                }
            });
        }
        // enabled sort
        if (MainPage.getEnabledSort() !== "none") {
            result.sort((a, b) => {
                if (MainPage.getEnabledSort() === "desc") {
                    return (session_projects[b].enabled ? 1 : 0) - (session_projects[a].enabled ? 1 : 0);
                }
                else {
                    return (session_projects[a].enabled ? 1 : 0) - (session_projects[b].enabled ? 1 : 0);
                }
            });
        }
        // [All Projects...] project first
        if (user.settings.isAllProjectFirst() && session_projects["all_projects"]) {
            result.sort((a, b) => {
                return ((session_projects[b].project as ItemProject).all_item_project ? 1 : 0)
                    - ((session_projects[a].project as ItemProject).all_item_project ? 1 : 0);
            });
        }

        return result;
    }

    function updateInventory() {
        console.log("main page - updating inventory");
        _inventory_string = JSON.stringify(user.inventory.get());
        buildQuests();
    }

    function updateProjectList() {
        console.log("main page - updating projects");
        buildProjects(); // buildQuests() included here
        _project_keys = sortProjects();
    }

    interface UpdateProjectEvent {
        detail: {
            data: {
                project_id: number;
                project: CharacterProject | ItemProject;
            };
        };
    };
    function updateProject(event : UpdateProjectEvent) {
        user.projects.replace(event.detail.data.project_id, event.detail.data.project);
        updateProjectList();
    }

    interface EditProjectEvent {
        detail: {
            data: {
                project_id: number;
            };
        };
    };
    function editProject(event : EditProjectEvent) {
        project_editor_project = event.detail.data.project_id;
        open_project_editor = true;
    }

    interface DeleteProjectEvent {
        detail: {
            data: {
                project_id: number;
            };
        };
    };
    function deleteProject(event : DeleteProjectEvent) {
        user.projects.delete(event.detail.data.project_id);
        delete session_projects[event.detail.data.project_id];
        updateProjectList();
    }

    interface EnableProjectEvent {
        detail: {
            data: {
                project_id: number;
                enabled: boolean;
            };
        };
    };
    function enableProject(event : EnableProjectEvent) {
        session_projects[event.detail.data.project_id].enabled = event.detail.data.enabled;
        if (user.settings.isKeepEnabledProjects()) {
            const projs = user.settings.getKeepEnabledProjectsEnabledProjects();
            if (event.detail.data.enabled && !projs[event.detail.data.project_id]) {
                projs[event.detail.data.project_id] = true;
            }
            else {
                delete projs[event.detail.data.project_id];
            }
            user.settings.setKeepEnabledProjectsEnabledProjects(projs);
        }
        buildQuests();
    }

    function buildQuests() {
        console.log("!!!! building quests", session_projects);
        built_quests = questAPI.build2({
            session_projects,
            use_inventory: true,
        });
        quest_simulator.updateStaminaOverlay(session_projects);

        if (MainPage.getEnabledSort() !== "none" && !open_quest_list) {
            // only sort via enabled if quest list isnt open
            _project_keys = sortProjects();
        }
    }
</script>

<section>
    <!-- end of service announcement -->
    <div class="my-1 flex flex-col items-center justify-center gap-2">
        <div class="text-black mx-4 w-[90vw] max-w-[1000px]">
            <Card>
                <div style="padding: 1rem;" class="flex flex-row">
                    <div>
                        <h1 class="font-bold text-xl">
                            <code class="text-[#D63384]">priconne-quest-helper</code> End of Service Announcement
                        </h1>
                    </div>
                </div>
                <p style="padding: 1rem;" class="text-black/70 mb-4">
                    <code class="text-[#D63384]">priconne-quest-helper</code> will no longer be updated.<br>
                    For more information:<br>
                    <a class="text-blue-500 font-extrabold" href="https://github.com/Spugn/priconne-quest-helper?tab=readme-ov-file#end-of-service-announcement" target="_blank" rel="noreferrer">
                        https://github.com/Spugn/priconne-quest-helper#end-of-service-announcement
                    </a>
                </p>
            </Card>
        </div>
    </div>
    <div class="my-1 flex flex-col items-center justify-center gap-2">
        <!-- buttons (create project, open quests) -->
        <div class="w-[90vw] flex flex-row gap-2">
            <Button class="flex-1" variant="raised" on:click={() => open_project_creator = true}>
                <Icon class="material-icons">add</Icon>
                <Label>Create Project</Label>
            </Button>
            <Button color="secondary" class="flex-1" variant="raised" on:click={() => open_sort_options = true}>
                <Icon class="material-icons">sort</Icon>
                <Label>Sort</Label>
            </Button>
        </div>
        <div class="w-[90vw] flex flex-row gap-2">
            <Button class="flex-1" variant="raised" disabled={built_quests?.projects.length <= 0}
                on:click={() => open_quest_list = true}
            >
                <Icon>
                    <Image img="album_2" type="webpage" alt={`open quests`} picture_class={built_quests?.projects.length <= 0 ? "grayscale opacity-50" : ""}
                        force_png={true} />
                </Icon>
                <Label>Quests</Label>
            </Button>
            {#if !hide_simulator_button}
                <Button class="flex-1" variant="raised" disabled={built_quests?.projects.length <= 0}
                    on:click={() => open_quest_simulator = true}
                >
                    <Icon class="material-icons">description</Icon>
                    <Label>Simulator</Label>
                </Button>
            {/if}
        </div>
    </div>
    <div class="project-list" class:compact-project-list={compact_projects}>
        <!-- list -->
        {#if user.isInit()}
            {#if _project_keys.length > 0}
                {#each _project_keys as project_id (JSON.stringify({
                    // including `required` in here would cause issues with partial completion
                    name: session_projects[project_id].project.details?.name || "",
                    date: session_projects[project_id].project.date,
                    priority: session_projects[project_id].project.priority,
                    //enabled: session_projects[project_id].enabled,
                    edited: session_projects[project_id].edited, // timestamp of last edited so proj can update if edited changed
                }))}
                    <Project {project_id} bind:show_menu bind:project_displayed bind:_inventory_string
                        compact={compact_projects}
                        enabled={session_projects[project_id].enabled}
                        {...(project_id === "all_projects" && { all_project: session_projects["all_projects"].project })}
                        on:update_inventory={updateInventory}
                        on:update_project={updateProject}
                        on:edit_project={editProject}
                        on:delete_project={deleteProject}
                        on:toggle_enabled={enableProject}
                    />
                {/each}
            {:else}
                <div class="my-1 flex flex-col items-center justify-center gap-2 h-[50vh]">
                    <strong>No projects found</strong>
                    <small>Get started by creating a new project.</small>
                    <Button class="mt-4" variant="raised" on:click={() => open_project_creator = true}>
                        <Icon class="material-icons">add</Icon>
                        <Label>Create Project</Label>
                    </Button>
                </div>
            {/if}
        {/if}
    </div>
    <ProjectCreator bind:open={open_project_creator} on:success={() => {
        updateProjectList();
    }} />
    <ProjectEditor bind:open={open_project_editor} project_id={project_editor_project}
        on:success={(event) => {
            user.projects.replace(event.detail.data.project_id, event.detail.data.project);
            session_projects[event.detail.data.project_id].edited = Date.now();
            updateProjectList();
        }}
    />
    <QuestList bind:open={open_quest_list} bind:quest_build_results={built_quests}
        on:rebuild={buildQuests}
        on:update_inventory={updateInventory}
    />
    <QuestSimulator bind:this={quest_simulator}
        bind:open={open_quest_simulator} bind:session_projects={session_projects}
    />
    <ProjectSortOptions bind:open={open_sort_options} bind:changed={sort_options_changed} />
</section>

<style>
    .project-list {
        padding-bottom: 5vh;
    }
    .compact-project-list {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 0.25rem;
        margin-top: 2rem;
        margin-left: 2rem;
        margin-right: 2rem;
    }
</style>