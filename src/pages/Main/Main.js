import React, { useState, useEffect, useReducer } from 'react';

import LoadingScreen from '../../components/LoadingScreen';
import BurgerMenu from '../../components/BurgerMenu';
import Title from '../../components/Title';
import Home from './Home';
import Characters from './Characters';
import Inventory from './Inventory';
import Settings from './Settings';
import data_utils from '../../scripts/data_utils';
import _CONSTANTS, { INIT_USER_STATE, INIT_DATA_STATE } from '../../scripts/constants';
import './Main.css';
import '../../react-burger-menu.css';
import { useCallback } from 'react';

/**
 * MANAGES THE MAIN PAGE.
 *
 * @returns {React.Component}
 */
export default function Main() {
    // loading screen stuff
    const [loading, setLoading] = useState(true);
    const [dataReadError, setDataReadError] = useState(false);

    // burger menu stuff
    const [menuOpen, setMenuOpen] = useState(false); // burger menu open/close
    const [currentPage, setCurrentPage] = useState(_CONSTANTS.PAGE_CATEGORIES.HOME); // current page
    const [data] = useState(JSON.parse(JSON.stringify(INIT_DATA_STATE))); // use of state here so values dont reset

    /// user state
    const [userState, userDispatch] = useReducer(userReducer, JSON.parse(JSON.stringify(INIT_USER_STATE)), () => {
        if (typeof(Storage) !== "undefined" && localStorage.getItem('userState') !== null) {
            console.log("return userState", JSON.parse(localStorage.getItem('userState')));
            return JSON.parse(localStorage.getItem('userState'));
        }
        return JSON.parse(JSON.stringify(INIT_USER_STATE));
    });

    /**
     * SETUP CHARACTER/EQUIPMENT/QUEST DATA HERE
     */
     const setup = useCallback(async () => {
        await fetch(_CONSTANTS.DATA_LOCATION).then(response => {
            return response.json();
        }).then(result => {
            // setup character data and get max_rank
            data.character.data = result.character;
            for (const key in result.character) {
                let max = 1;
                for (const rank_key in result.character[key].equipment) {
                    max = Math.max(max, parseInt(rank_key.split('_')[1]));
                }
                data.character.max_rank = max;
                // we only care about the first entry, assume everyone else has this max rank
                break;
            }

            // setup equipment data
            data.equipment.data = result.equipment;

            // setup quest data and find max_chapter
            data.quest.data = result.quest;
            let max = 1;
            for (const key in result.quest) {
                const chapter = key.split('-')[0];
                max = Math.max(max, parseInt(chapter));
            }
            data.quest.max_chapter = max;

            // data collection complete, reveal page
            setLoading(false);
        }).catch((e) => {
            // display loading error message
            console.log(e);
            setDataReadError(true);
        });
    }, [data.character, data.equipment, data.quest]);

    useEffect(() => {
        setup();
    }, [setup]);

    return (
        <>
            <LoadingScreen {...{ loading, dataReadError, userState, userDispatch }} />
            <BurgerMenu {...{ menuOpen, setMenuOpen, currentPage, setCurrentPage }} />
            <Title />
            {!loading &&
                <>
                    <Home {...{data, userState, userDispatch,
                        hidden: currentPage !== _CONSTANTS.PAGE_CATEGORIES.HOME }} />
                    <Characters {...{data, userState, userDispatch,
                        hidden: currentPage !== _CONSTANTS.PAGE_CATEGORIES.CHARACTERS }} />
                    <Inventory {...{data, dataUtils: data_utils(data), userState, userDispatch,
                        hidden: currentPage !== _CONSTANTS.PAGE_CATEGORIES.INVENTORY }} />
                    <Settings {...{userState, userDispatch,
                        hidden: currentPage !== _CONSTANTS.PAGE_CATEGORIES.SETTINGS }} />
                </>
            }
        </>
    );
}

/**
 * FUNCTION TO MAKE CHANGES TO THE USER STATE.
 *
 * @param {Object} state     CURRENT USER STATE.
 * @param {Object} action    ACTION THAT SHOULD BE DONE, CONTAINS TYPE AND PAYLOAD.
 * @returns MODIFIED USER STATE. SINCE THIS A REDUCER, IT RETURNS UNDEFINED.
 */
function userReducer(state, action) {
    let changes;
    switch (action.type) {
        case 'SET_INVENTORY':
            changes = {
                ...state,
                inventory: action.payload,
            };
            saveLocalStorage(changes);
            return changes;
        case 'SET_INVENTORY_AMOUNT':
            if ((state.inventory[action.payload.id] || 0) === action.payload.amount) {
                return state;
            }
            if (action.payload.amount <= 0) {
                if (state.inventory[action.payload.id]) {
                    delete state.inventory[action.payload.id];
                }
                changes = {
                    ...state,
                    inventory: {
                        ...state.inventory,
                    },
                };
                saveLocalStorage(changes);
                return changes;
            }
            changes = {
                ...state,
                inventory: {
                    ...state.inventory,
                    [action.payload.id]: action.payload.amount,
                },
            };
            saveLocalStorage(changes);
            return changes;
        case 'SET_CHARACTER':
            changes = {
                ...state,
                character: action.payload,
            };
            saveLocalStorage(changes);
            return changes;
        case 'SET_PROJECTS':
            changes = {
                ...state,
                projects: action.payload,
            };
            saveLocalStorage(changes);
            return changes;
        case 'REPLACE_PROJECT':
            const index = state.projects.findIndex(project => project.date === action.payload.date);
            if (index === -1) {
                return state;
            }
            changes = {
                ...state,
                projects: [
                    ...state.projects.slice(0, index),
                    action.payload,
                    ...state.projects.slice(index + 1),
                ],
            };
            saveLocalStorage(changes);
            return changes;
        case 'DELETE_PROJECT': {
            const index = state.projects.findIndex(project => project.date === action.payload.date);
            if (index === -1) {
                return state;
            }
            changes = {
                ...state,
                projects: [
                    ...state.projects.slice(0, index),
                    ...state.projects.slice(index + 1),
                ],
            };
            saveLocalStorage(changes);
            return changes;
        }
        case 'COMPLETE_PROJECT': {
            const index = state.projects.findIndex(project => project.date === action.payload.project.date);
            if (index === -1) {
                return state;
            }
            let result = action.payload.settings.consume
                ? data_utils(action.payload.data).project.consume(action.payload.project, state.inventory,
                    state.settings.region,
                    action.payload.project.details.ignored_rarity || {})
                : state.inventory;
            if (action.payload.settings.save && action.payload.project.type === "character") {
                const id = action.payload.project.details.avatar_id;
                changes = {
                    ...state,
                    inventory: result,
                    character: {
                        ...state.character,
                        [id]: state.character[id] || { id: id },
                        [id]: {
                            ...state.character[id],
                            rank: action.payload.project.details.end.rank,
                            equipment: action.payload.project.details.end.equipment,
                        },
                    },
                    projects: [
                        ...state.projects.slice(0, index),
                        ...state.projects.slice(index + 1),
                    ],
                };
                saveLocalStorage(changes);
                return changes;
            }
            changes = {
                ...state,
                inventory: result,
                projects: [
                    ...state.projects.slice(0, index),
                    ...state.projects.slice(index + 1),
                ],
            };
            saveLocalStorage(changes);
            return changes;
        }
        case 'SET_SETTINGS':
            changes = {
                ...state,
                settings: {
                    ...state.settings,
                    [action.payload.key]: action.payload.data,
                },
            };
            saveLocalStorage(changes);
            return changes;
        default:
            return state;
    }
}

function saveLocalStorage(state) {
    if (typeof(Storage) === "undefined") {
        return;
    }
    localStorage.setItem('userState', JSON.stringify(state));
    console.log("saved state", state);
}