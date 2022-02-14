import React, { useState, useRef, useEffect } from "react";
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Grid from '@mui/material/Grid';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ItemButton from './ItemButton';
import { IgnoredRarities } from "./ProjectBuilder";
import _CONSTANTS from "../scripts/constants";
import ItemCatalog from "./ItemCatalog";

export default function EditItemDetails({ data, project, closeModal }) {
    const [textFieldError, setTextFieldError] = useState(false);
    const [projectItems, setProjectItems] = useState([]);
    const projectName = useRef(project.current.details.name); // item projects should always have a name
    const projectEdit = useRef(JSON.parse(JSON.stringify(project.current))); // copy of project in case user cancels

    useEffect(() => {
        buildProjectDetails();
    }, []);

    function buildProjectDetails() {
        let tProjectItems = [];
        Object.entries(projectEdit.current.required).forEach(([id, quantity]) => {
            tProjectItems.push(
                <ItemButton {...{
                    id,
                    quantity,
                    callback: () => handleProjectDetailsClick(id),
                }} key={`project-edit-item-project-details--${id}`} />
            );
        });
        setProjectItems(tProjectItems);
    }
    function handleProjectDetailsClick(id) {
        console.log("handleProjectDetailsClick", id);
        projectEdit.current = {
            ...projectEdit.current,
            required: {
                ...projectEdit.current.required,
                [id]: projectEdit.current.required[id] - 1,
            },
        };
        if (projectEdit.current.required[id] <= 0) {
            delete projectEdit.current.required[id];
        }
        buildProjectDetails();
    }

    return (
        <Grid
            container
            direction="column"
            alignItems="center"
            justifyContent="center"
            gap={1}>
            <Collapse in={textFieldError}>
                <Alert severity="error" className="text-left">
                    <AlertTitle>Invalid Project Error</AlertTitle>
                    A project name is required.
                </Alert>
            </Collapse>
            <TextField
                required
                error={textFieldError}
                defaultValue={project.current.details.name}
                label="Project Name"
                helperText="Required"
                variant="outlined"
                autoComplete="off"
                onChange={() => {
                    setTextFieldError(false);
                }}
                inputRef={projectName} />
            <Grid
                container
                direction="row"
                alignItems="center"
                justifyContent="center"
                className="overflow-y-auto py-3 rounded bg-black/[0.1] mb-2 max-h-[50vh]"
                gap={0.3}>
                {projectItems}
                {projectItems.length <= 0 && <span className="italic">No items selected...</span>}
            </Grid>
            <Button color="warning" disabled={projectItems.length <= 0}
                onClick={() => {
                    projectEdit.current.required = {};
                    buildProjectDetails();
                }}>
                Clear all items
            </Button>
            <div className="w-full">
                <ItemCatalog {...{ data,
                    callback: (id) => {
                        projectEdit.current = {
                            ...projectEdit.current,
                            required: {
                                ...projectEdit.current.required,
                                [id]: projectEdit.current.required[id] ? projectEdit.current.required[id] + 1 : 1,
                            },
                        };
                        if (projectEdit.current.required[id] > _CONSTANTS.INVENTORY.FULL_MAX) {
                            project.current.required[id] = _CONSTANTS.INVENTORY.FULL_MAX;
                            return; // probably dont need to update project details since nothing changed.
                        }
                        buildProjectDetails();
                    },
                    keyPrefix: "item-project-edit",
                    hidden: false }} />
            </div>
            <div className="w-full mb-3">
                <Divider textAlign="left">Additional Details</Divider>
                <div className="space-y-3">
                    <IgnoredRarities {...{ project: projectEdit }} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-1 w-full">
                <Button variant="outlined" color="error" onClick={() => {
                    closeModal();
                }}>
                    Cancel
                </Button>
                <Button variant="contained" color="primary" onClick={() => {
                    if (projectName.current.value === "") {
                        setTextFieldError(true);
                        return;
                    }
                    // PROJECT IS TECHNICALLY DONE
                    projectEdit.current.details.name = projectName.current.value;
                    project.current = projectEdit.current;
                    closeModal(true);
                }}>
                    Edit Project
                </Button>
            </div>
        </Grid>
    );
}