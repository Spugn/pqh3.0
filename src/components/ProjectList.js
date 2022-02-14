import { useEffect, useState } from "react";
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Grid from '@mui/material/Grid';
import ProjectCard from "./ProjectCard";

/**
 * MANAGES THE PROJECT LIST.
 * THE PROJECT LIST DISPLAYS A COLLECTION OF PROJECT CARD COMPONENTS
 *
 * @param {Object} param0                         OBJECT WITH THE FOLLOWING PROPERTIES
 * @param {Object} param0.data                    OBJECT WITH EQUIPMENT/QUEST/CHARACTER DATA
 * @param {Object} param0.projectMap              MAP CONTAINING ENABLED/DISABLED STATES AND THE PROJECT DATA OF
 *                                                PROJECTS
 * @param {Function} param0.projectMapDispatch    FUNCTION TO UPDATE THE PROJECT MAP
 * @param {Object} param0.userState               OBJECT CONTAINING INFORMATION ABOUT USER'S PROJECTS/INVENTORY/ETC
 * @param {Function} param0.userDispatch          FUNCTION TO UPDATE USER'S PROJECTS/INVENTORY/ETC
 * @param {Boolean} param0.hidden                 BOOLEAN INDICATING IF THE PROJECT LIST SHOULD BE INVISIBLE OR NOT.
 *                                                THIS IS ALSO USED TO SUPRESS UPDATES
 * @returns PROJECT LIST COMPONENT
 */
export default function ProjectList({ data, projectMap, projectMapDispatch, userState, userDispatch, hidden }) {
    const [projects, setProjects] = useState([]);

    /**
     * TRIGGERS WHEN THE PROJECT LIST SWITCHES FROM HIDDEN, USER'S INVENTORY IS UPDATED, OR THE PROJECT MAP IS UPDATED.
     * WHEN VISIBLE, REFRESH THE PROJECT LIST.
     */
    useEffect(() => {
        if (hidden) {
            // ignore if hidden
            return;
        }
        let tProjects = [];
        projectMap.forEach(([enabled, project]) => {
            const key = `project--${project.date}-${JSON.stringify(userState.inventory)}`;
            tProjects.push(
                <ProjectCard key={key} {...{data, project, defaultEnabled: enabled,
                    projectMapDispatch,
                    userState, userDispatch }} />
            );
        });

        tProjects.sort((a, b) => {
            if (a.props.project.priority && !b.props.project.priority) return -1; // priority projects first
            if (!a.props.project.priority && b.props.project.priority) return 1;
            return 0;
        });

        setProjects(tProjects);
    }, [hidden, projectMap, userState.inventory]);

    return (
        <>
            <Grid
                container
                direction="row"
                alignItems="center"
                justifyContent="center"
                className="mb-10"
                gap={0.5}>
                {projects.length <= 0 &&
                    <Alert severity="warning">
                        <AlertTitle>No Projects Found</AlertTitle>
                        Click the <strong>New Project</strong> button to create a new project.
                    </Alert>
                }
                {projects.length > 0 && projects}
            </Grid>
        </>
    );
}