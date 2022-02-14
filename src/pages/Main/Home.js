import React, { useState, useEffect, useReducer } from 'react';
import BetaAlert from '../../components/BetaAlert';
import MiyakoMenuTip from '../../components/MiyakoMenuTip';
import ProjectBuilder from '../../components/ProjectBuilder';
import ProjectList from '../../components/ProjectList';
import QuestDrawer from '../../components/QuestDrawer';

/**
 * HOME PAGE COMPONENT.
 * CONTAINS COMPONENTS RELATED TO PROJECTS AND THE QUEST DRAWER.
 *
 * @param {Object} param0                 OBJECT WITH THE FOLLOWING PROPERTIES
 * @param {Object} param0.data            OBJECT WITH EQUIPMENT/QUEST/CHARACTER DATA
 * @param {Object} param0.userState       OBJECT CONTAINING INFORMATION ABOUT USER'S PROJECTS/INVENTORY/ETC
 * @param {Object} param0.userDispatch    FUNCTION TO UPDATE USER'S PROJECTS/INVENTORY/ETC
 * @param {Object} param0.hidden          BOOLEAN INDICATING IF THE HOME PAGE SHOULD BE INVISIBLE OR NOT
 * @returns HOME PAGE COMPONENT
 */
export default function Home({ data, userState, userDispatch, hidden }) {
    // "date" : [enabled?, project]
    const [initProjectMap, setInitProjectMap] = useState(false);
    const [projectMap, projectMapDispatch] = useReducer(projectMapReducer, new Map());
    const [questDrawerOpen, setQuestDrawerOpen] = useState(false);

    /**
     * TRIGGERS WHEN THE USER'S PROJECTS ARE UPDATED.
     * REFRESHES THE PROJECT MAP.
     */
    useEffect(() => {
        if (hidden) {
            // IGNORE IF HIDDEN
            return;
        }
        projectMapDispatch({
            type: 'REFRESH_PROJECT_MAP',
            payload: userState.projects,
        });
        setInitProjectMap(true);
    }, [hidden, userState.projects]);

    if (!initProjectMap) {
        // wait for projectmap init first
        return (<></>);
    }

    return (
        <div hidden={hidden}>
            <div className={"grid grid-cols-1"}>
                <BetaAlert />
                <MiyakoMenuTip {...{ userState, userDispatch }} />
                <ProjectBuilder {...{ data, userState, userDispatch }} />
                <ProjectList {...{ data, projectMap, projectMapDispatch, userState, userDispatch,
                    hidden: (hidden || questDrawerOpen) }} />
                <QuestDrawer {...{ open: questDrawerOpen, setOpen: setQuestDrawerOpen, data, projectMap, userState,
                    userDispatch, hidden }} />
            </div>
        </div>
    );
}

/**
 * REFRESHES THE PROJECT MAP.
 *
 * @param {Object} projects     OBJECT CONTAINING THE USER'S CURRENT PROJECTS
 * @param {*} prevProjectMap    PREVIOUS PROJECT MAP TO EXTRACT ENABLED/DISABLED STATUS FROM
 * @returns NEW PROJECT MAP
 */
function refreshProjectMap(projects, prevProjectMap) {
    const newMap = new Map();
    for (const proj of projects) {
        if (prevProjectMap.has(proj.date)) {
            // project already exists
            newMap.set(proj.date, [prevProjectMap.get(proj.date)[0], proj]);
            continue;
        }
        newMap.set(proj.date, [false, proj]);
    }
    return newMap;
}

/**
 * REDUCER FOR THE PROJECT MAP.
 * THE `return new Map(...);` IS NECECSSARY TO ACTUALLY UPDATE THE MAP.
 * `return state.set(...);` WILL NOT WORK.
 *
 * @param {Map} state        CURRENT PROJECT MAP
 * @param {Object} action    OBJECT CONTAINING THE TYPE AND PAYLOAD
 * @returns NEW PROJECT MAP STATE (SINCE IT'S A REDUCER THOUGH IT RETURNS UNDEFINED)
 */
function projectMapReducer(state, action) {
    switch (action.type) {
        case 'ENABLE_PROJECT':
            return new Map(state.set(action.payload.date, [true, action.payload]));
        case 'SET_ENABLE_PROJECT':
            return new Map(state.set(action.payload.project.date, [action.payload.enabled, action.payload.project]));
        case 'REFRESH_PROJECT_MAP':
            return refreshProjectMap(action.payload, state);
        default:
            return state;
    }
}