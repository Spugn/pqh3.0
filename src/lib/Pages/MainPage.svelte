<script context="module">
    import Button, { Label, Icon } from "@smui/button";
    import { user, equipment as equipmentAPI, project as projectAPI, inventory as inventoryAPI,
        quest as questAPI,
    } from "$lib/api/api";
    import Image from "$lib/Image.svelte";
    import Project from "$lib/Project/Project.svelte";
</script>

<script lang="ts">
    import type { CharacterProject, ItemProject, QuestBuild2Results, Recipe, SessionProjects } from '$lib/api/api.d';
    import ProjectCreator from '$lib/ProjectBuilder/ProjectCreator.svelte';
    import { onMount } from "svelte";
    import ProjectEditor from "$lib/ProjectBuilder/ProjectEditor.svelte";
    import QuestList from '$lib/QuestList/QuestList.svelte';

    export let show_menu : boolean;
    let project_displayed : boolean = false; // flag for if a project is expanded. if so, hide non-expanded projects
    let _inventory_string = JSON.stringify(user.inventory.get()); // used as a global indicator for if a project should update due to inventory changes
    let session_projects : SessionProjects = {}; // used to store enabled/disabled projects and their data
    let _project_keys : string[] = []; // sorted list of keys for the project list
    let open_project_creator : boolean = false;
    let open_project_editor : boolean = false;
    let open_quest_list : boolean = false;
    let project_editor_project : number = -1;
    let built_quests : QuestBuild2Results;

    onMount(async () => {
        session_projects = user.getSessionProjects();
        buildProjects();
        _project_keys = sortProjects();
    });

    function buildProjects() {
        const user_projects = user.projects.get();
        for (const project_id in user_projects) {
            if (!session_projects[project_id]) {
                // init project as session project
                session_projects[project_id] = {
                    enabled: user.settings.isAutoEnableProjects() ? true : false,
                    edited: user_projects[project_id].date as number,
                    project: user_projects[project_id],
                };
            }
            else {
                // update project data and keep enabled/disabled status
                session_projects[project_id] = {
                    ...session_projects[project_id],
                    project: user_projects[project_id],
                }
            }
        }
        session_projects = session_projects; // force reaction
        buildQuests();
    }

    function sortProjects() {
        // sorting by priority or not, could do something more like sort by completion but kinda lazy
        // and also having to sort every time may be time consuming, idk
        let result = Object.keys(session_projects);
        result.sort((a, b) => {
            return (session_projects[b].project.priority ? 1000 : 0) - (session_projects[a].project.priority ? 1000 : 0);
        });
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
        buildQuests();
    }

    function buildQuests() {
        console.log("!!!! building quests", session_projects);
        built_quests = questAPI.build2({
            session_projects,
            use_inventory: true,
        });
    }
</script>

<section>
    <div class="my-1 flex flex-col items-center justify-center gap-2">
        <!-- buttons (create project, open quests) -->
        <Button class="w-[90vw]" variant="raised" on:click={() => open_project_creator = true}>
            <Icon class="material-icons">add</Icon>
            <Label>Create Project</Label>
        </Button>
        <Button class="w-[90vw]" variant="raised" disabled={built_quests?.projects.length <= 0}
            on:click={() => open_quest_list = true}
        >
            <Icon>
                <Image img="album_2" type="webpage" alt={`open quests`} picture_class={built_quests?.projects.length <= 0 ? "grayscale opacity-50" : ""}
                    force_png={true} />
            </Icon>
            <Label>Quests</Label>
        </Button>
    </div>
    <div class="project-list">
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
                        enabled={session_projects[project_id].enabled}
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
</section>

<style>
    .project-list {
        padding-bottom: 5vh;
    }
</style>