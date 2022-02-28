import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import Fab from '@mui/material/Fab';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import InputNumber from 'rc-input-number';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import InfiniteScroll from 'react-infinite-scroller';
import FormControl from '@mui/material/FormControl';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Backdrop from '@mui/material/Backdrop';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import AddIcon from '@mui/icons-material/Add';
import Divider from '@mui/material/Divider';
import SettingsIcon from '@mui/icons-material/Settings';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import data_utils from '../scripts/data_utils';
import _CONSTANTS, { MODAL_STYLE } from '../scripts/constants';
import './QuestDrawer.css';
import ItemCatalog from './ItemCatalog';

/**
 * COMPONENT THAT MANAGES THE QUEST DRAWER AND THE BUTTON TO OPEN IT.
 * THE QUEST DRAWER IS AN AREA WHERE A LIST OF QUESTS ARE DISPLAYED TO THE USER.
 * THE USER CAN SELECT A QUEST TO VIEW MORE SPECIFIC INFORMATION SUCH AS THE DROP RATE, REQUIRED ITEMS, AND
 * REQUIRED PRIORITY.
 * THE QUEST DRAWER IS ALSO WHERE QUEST RELATED SETTINGS SUCH AS THE QUEST RANGE OR ITEM FILTER IS MANAGED.
 *
 * @param {Object} param0                   OBJECT CONTAINING REQUIRED VARIABLES AND FUNCTIONS FOR THE COMPONENT
 * @param {boolean} param0.open             STATE VARIABLE TO OPEN THE QUEST DRAWER
 * @param {Function} param0.setOpen         FUNCTION TO SET THE STATE VARIABLE TO OPEN/CLOSE THE QUEST DRAWER
 * @param {Object} param0.data              OBJECT CONTAINING ALL DATA, FOUND IN state.data
 * @param {Map} param0.projectMap           MAP STATE FROM Home.js CONTAINING ALL PROJECTS AND THEIR
 *                                          ENABLED/DISABLED STATUS
 * @param {Object} param0.userState         OBJECT CONTAINING ALL USER INFORMATION LIKE INVENTORY AND PROJECTS
 * @param {Function} param0.userDispatch    FUNCTION TO MODIFY USER STATE
 * @param {boolean} param0.hidden           BOOLEAN FOR IF THE PARENT FUNCTION IS SUPPOSED TO BE HIDDEN.
 * @returns JSX COMPONENT FOR THE QUEST DRAWER AND BUTTON TO OPEN IT.
 */
export default function QuestDrawer({ open, setOpen, data, projectMap, userState, userDispatch, hidden }) {
    const [quests, setQuests] = useState([]); // array of jsx objects of quest cards
    const [questDisplayCount, setQuestDisplayCount] = useState(_CONSTANTS.QUEST.STEP); // amount of quests to display

    // settings
    const [openSettings, setOpenSettings] = useState(false);
    const [settings, setSettings] = useState({...userState.settings.quest});
    const questRangeSlider = useRef([userState.settings.quest?.chapter?.min || 1,
        userState.settings.quest?.chapter?.max || data.quest.max_chapter]); // used to keep track of the slider values
    const settingsBuild = useRef(false); // if true, use _data_utils.build() instead of search() when settings change

    // quest compilation stuff
    const [estimatedQuestCount, setEstimatedQuestCount] = useState(0); // an estimate of quests available to the user
    const projects = useRef([]); // array of enabled project objects
    const compiled = useRef({}); // has collection of required (full) items and their amounts
    const builtQuestInfo = useRef({}); // contains required, priority_items, priority_amount to recompile quests

    // quest inventory edit modal stuff
    const [questModalOpen, setQuestModalOpen] = useState(false);
    const questModalInfo = useRef({});

    // filter modal stuff
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const filterModalInfo = useRef([]);

    // quest update checks
    // stringified compiled object, if this doesnt change then dont bother updating
    const [compiledCheck, setCompiledCheck] = useState("{}");

    /**
     * TRIGGERS WHEN THE COMPILED REQUIRED ITEMS CHANGES.
     * BUILDS AN ESTIMATED COUNT FOR AVAILABLE QUESTS.
     */
    useEffect(() => {
        // only do extensive quest calc when drawer open
        if (projects.current.length <= 0) {
            // no projects enabled
            setEstimatedQuestCount(0);
            return;
        }
        setEstimatedQuestCount(data_utils(data).quest.estimate(compiled.current));
    }, [compiledCheck]);

    /**
     * TRIGGERS WHEN SETTINGS CHANGE.
     * UPDATES THE AVAILABLE QUEST LIST IF THE QUEST DRAWER IS OPEN.
     */
    useEffect(() => {
        // update settings in user state
        if (!open) {
            // ignore if quest drawer not open because settings can only be modified there anyways
            return;
        }
        console.log(userState.settings);
        let qs;
        if (settingsBuild.current) {
            // rebuild quests
            settingsBuild.current = false;
            const q = data_utils(data).quest.build({
                all_projects: userState.projects,
                compiled: compiled.current,
                inventory: userState.inventory,
                settings,
                use_inventory: true,
                recipe_version: userState.settings.use_legacy ? _CONSTANTS.RECIPE_NOTE.LEGACY
                    : userState.settings.use_legacy_2 ? _CONSTANTS.RECIPE_NOTE.LEGACY_2 : undefined,
            });
            builtQuestInfo.current = {
                required: q.required,
                required_clean: q.required_clean,
                priority_items: q.priority_items,
                priority_amount: q.priority_amount,
            };
            qs = buildQuests({
                ...q,
                handleQuestModalOpen,
            });
        }
        else {
            // use cached quest info
            const quest_scores = data_utils(data).quest.search({
                required: builtQuestInfo.current.required,
                priority_items: builtQuestInfo.current.priority_items,
                settings,
            });
            qs = buildQuests({
                data,
                required: builtQuestInfo.current.required,
                quest_scores,
                priority_items: builtQuestInfo.current.priority_items,
                DIFFICULTY: data_utils(data).quest.DIFFICULTY,
                handleQuestModalOpen,
            });
        }
        setQuests(qs);
        setQuestDisplayCount(qs.length > _CONSTANTS.QUEST.STEP ? _CONSTANTS.QUEST.STEP : qs.length);
        userDispatch({
            type: "SET_SETTINGS",
            payload: {
                key: "quest",
                data: settings,
            },
        })
    }, [settings]);

    /**
     * TRIGGERS WHEN THE PROJECT MAP CHANGES.
     * COMPILES THE REQUIRED ITEMS FROM THE ENABLED PROJECTS TO CHECK IF QUESTS NEED TO BE UPDATED.
     */
    useEffect(() => {
        if (hidden) {
            // STOP CHECKING FOR NEW QUESTS IF NOT LOADED
            return;
        }
        projects.current = [];
        compiled.current = {};
        projectMap.forEach(([enabled, project]) => {
            if (!enabled) {
                return;
            }
            projects.current.push(project);
            Object.entries(project.required).forEach(([id, quantity]) => {
                compiled.current[id] = (compiled.current[id] || 0) + quantity;
            });
        });
        setCompiledCheck(JSON.stringify(compiled.current));
    }, [projectMap]);

    /**
     * TRIGGERS WHEN THE QUEST DRAWER OPENS.
     * PERFORMS THE HIGH-COST QUEST LIST BUILD.
     */
    useEffect(() => {
        if (!open) {
            // ignore if quest drawer is closed
            return;
        }
        questCalc();
    }, [open]);

    /**
     * TRIGGERS WHEN THE USER'S INVENTORY CHANGES WHILE THE QUEST MODAL IS OPEN.
     * PERFORMS UPDATES TO THE AVAILABLE QUEST LIST WHEN THE USER EDITS THEIR INVENTORY.
     */
    useEffect(() => {
        if (!questModalOpen) {
            return;
        }
        // update quest info
        questCalc();
    }, [userState.inventory]);

    /**
     * PERFORM A HIGH-COST QUEST CALCULATION.
     * IMPORTANT VARIABLES TO RECALCULATE QUESTS ARE CACHED IN builtQuestInfo AND CAN BE USED AGAIN VIA
     * _data_utils.quest.check() TO GET NEW QUEST RESULTS OFF SETTING CHANGES.
     * THE QUEST LIST IS UPDATED WITH THE NEW RESULTS.
     * IF THE QUEST MODAL IS OPEN, THE userState IS REFRESHED SO THAT INVENTORY IN THE QUEST MODAL WILL BE UPDATED.
     */
    function questCalc() {
        const q = data_utils(data).quest.build({
            all_projects: userState.projects,
            compiled: compiled.current,
            inventory: userState.inventory,
            settings,
            use_inventory: true,
            recipe_version: userState.settings.use_legacy ? _CONSTANTS.RECIPE_NOTE.LEGACY
                : userState.settings.use_legacy_2 ? _CONSTANTS.RECIPE_NOTE.LEGACY_2 : undefined,
        });
        builtQuestInfo.current = {
            required: q.required,
            required_clean: q.required_clean,
            priority_items: q.priority_items,
            priority_amount: q.priority_amount,
        };
        const qs = buildQuests({
            ...q,
            handleQuestModalOpen,
        });
        setQuests(qs);
        setQuestDisplayCount(qs.length > _CONSTANTS.QUEST.STEP ? _CONSTANTS.QUEST.STEP : qs.length);
        if (questModalOpen) {
            questModalInfo.current = {
                ...questModalInfo.current,
                userState, // need to update userState here so it updates in quest info modal
            };
        }
    }

    /**
     * OPEN QUEST DRAWER
     */
    function handleOpen() {
        setOpen(true);
    }

    /**
     * LOAD MORE QUEST RESULTS FROM QUEST DRAWER (USING InfiniteScroll from react-infinite-scroller)
     */
    function handleLoad() {
        const newCount = questDisplayCount + _CONSTANTS.QUEST.STEP;
        setQuestDisplayCount(newCount <= quests.length ? newCount : quests.length);
    }

    /**
     * OPEN QUEST MODAL AND PROVIDE NECESSARY VALUES TO questModalInfo FOR IT TO READ OFF OF.
     * @param {Object} questCardInfo    INFORMATION FROM THE SPECIFIC QuestCard
     */
    function handleQuestModalOpen(questCardInfo) {
        questModalInfo.current = {
            ...questCardInfo,
            questModalOpen: true,
            handleQuestModalClose,
            userState,
            handleInventoryChange,
            builtQuestInfo,
        };
        setQuestModalOpen(true);
    }

    /**
     * CLOSE QUEST MODAL
     */
    function handleQuestModalClose() {
        questModalInfo.current = {
            ...questModalInfo.current,
            questModalOpen: false,
        };
        setQuestModalOpen(false);
    }

    /**
     * OPEN THE SETTINGS FILTER MODAL.
     * COPY CURRENT FILTERED ITEMS TO filterModalInfo SO THAT CHANGES CAN BE SAVED ONCE THE MODAL IS CLOSED.
     */
    function handleFilterModalOpen() {
        filterModalInfo.current = settings.item_filter || [];
        setFilterModalOpen(true);
    }

    /**
     * CLOSE THE SETTINGS FILTER MODAL.
     * REPLACE THE filterModalInfo's ITEM FILTER WITH THE CURRENT SETTINGS
     */
    function handleFilterModalClose() {
        setSettings({
            ...settings,
            item_filter: filterModalInfo.current,
        });
        setFilterModalOpen(false);
    }

    /**
     * HANDLES THE INVENTORY CHANGE FROM THE QUEST MODAL.
     * IF THERE IS NO CHANGE, NOTHING HAPPENS.
     *
     * @param {Object} change    { id: "item_id", amount: <NEW INVENTORY AMOUNT> }
     */
    function handleInventoryChange(change) {
        if (change.amount === questModalInfo.current.userState.inventory[change.id]) {
            return;
        }
        userDispatch({
            type: "SET_INVENTORY_AMOUNT",
            payload: change,
        });
    }

    return (
        <>
            <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
                <Badge badgeContent={estimatedQuestCount} overlap="circular" max={99} color="error">
                    <Tooltip title="View Quests" arrow>
                        <span> {/* SPAN WRAPPER NEEDED HERE TO HANDLE mui Tooltip ERROR */}
                            <Fab variant="extended" disabled={estimatedQuestCount <= 0} onClick={() => handleOpen()}>
                                <img
                                    className={`h-8 w-8 ${estimatedQuestCount <= 0 ? 'grayscale opacity-50' : ''}`}
                                    src={`${process.env.PUBLIC_URL}/images/webpage/album_2.png`}
                                    loading="lazy"
                                    alt="open quests icon"/>
                                <img
                                    className={`absolute inline-flex h-8 w-8 animate-ping`}
                                    src={`${process.env.PUBLIC_URL}/images/webpage/album_2.png`}
                                    loading="lazy"
                                    hidden={estimatedQuestCount <= 0}
                                    alt="open quests icon ping"/>
                            </Fab>
                        </span>
                    </Tooltip>
                 </Badge>
            </Box>
            <Drawer
                anchor="bottom"
                open={open}
                onClose={() => {
                    setOpen(false);
                }}>
                <Stack
                    spacing={2}
                    className="quest-drawer"
                    id="scrollable"
                    sx={{
                        //maxHeight: '100vh',
                        maxHeight: "calc(90vh - 1in)",
                        overflow: "auto",
                    }
                }>
                    <Paper className="sticky top-0 left-2 z-10">
                        <div className="sticky top-0 grid grid-cols-2 w-full">
                            <IconButton className="inline-block w-fit hover:animate-spin" aria-label="settings"
                                onClick={() => setOpenSettings(!openSettings)}>
                                <SettingsIcon />
                            </IconButton>
                            <strong className="text-right mr-3">
                                Quests Displayed <div className="inline-block">
                                    ({questDisplayCount} / {quests.length})
                                </div>
                            </strong>
                        </div>
                        <Collapse in={openSettings}>
                            <Stack className="mb-3 max-h-[30vh] overflow-auto" gap={1}>
                                <Divider textAlign="left"><strong>General</strong></Divider>
                                <div className="mx-[5vw]">
                                    <Typography variant="button">
                                        Sorting
                                    </Typography>
                                    <Grid container direction="row" gap={1}>
                                        <Chip label="Quest List"
                                            variant="outlined"
                                            icon={settings?.sort?.list ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
                                            onClick={() => {
                                                setSettings({
                                                    ...settings,
                                                    sort: {
                                                        ...settings.sort,
                                                        // if true, sort by descending chapter
                                                        list: !(settings?.sort?.list || false),
                                                    }
                                                });
                                            }} />
                                        <Chip label="Quest Score"
                                            variant="outlined"
                                            icon={settings?.sort?.score ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                                            onClick={() => {
                                                setSettings({
                                                    ...settings,
                                                    sort: {
                                                        ...settings.sort,
                                                        // if true, sort by ascending score
                                                        score: !(settings?.sort?.score || false),
                                                    }
                                                });
                                            }} />
                                    </Grid>
                                </div>
                                <div className="mx-[5vw]">
                                    <Typography variant="button">
                                        Event Drop Buff
                                    </Typography>
                                    <Grid container direction="row" gap={1}>
                                        {_CONSTANTS.DIFFICULTY.map((diff) => {
                                            if (diff === "Event") {
                                                return (<span key={`quest-settings-drop-buff-form-control-${diff}`}></span>);
                                            }
                                            const id = `quest-settings-drop-buff-${diff}`;
                                            return (
                                                <FormControl className="w-[100px]"
                                                    key={`quest-settings-drop-buff-form-control-${diff}`}>
                                                    <InputLabel id={id}>{diff}</InputLabel>
                                                    <Select
                                                        labelId={id}
                                                        value={settings?.drop_buff?.[diff] || 1}
                                                        label={diff}
                                                        onChange={(event) => {
                                                            setSettings({
                                                                ...settings,
                                                                drop_buff: {
                                                                    ...settings.drop_buff,
                                                                    [diff]: event.target.value,
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        <MenuItem value={1}>x1</MenuItem>
                                                        <MenuItem value={2}>x2</MenuItem>
                                                        <MenuItem value={3}>x3</MenuItem>
                                                        <MenuItem value={4}>x4</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            );
                                        })}
                                    </Grid>
                                </div>
                                <Divider textAlign="left"><strong>Filter</strong></Divider>
                                <div className="mx-[5vw] max-w-[90vw]">
                                    <Typography variant="button">
                                        Quest Range (Chapter {settings?.chapter?.min || 1} - Chapter {
                                            settings?.chapter?.auto_max
                                            ? data.quest.max_chapter
                                            : settings?.chapter?.max || data.quest.max_chapter}
                                            {settings?.chapter?.auto_max ? ' (MAX)' : ''})
                                    </Typography>
                                    <div className="mx-[5vw]">
                                        <Slider
                                            key={`quest-range--${questRangeSlider.current[0]}-${
                                                questRangeSlider.current[1]}`}
                                            defaultValue={questRangeSlider.current}
                                            min={1}
                                            max={data.quest.max_chapter}
                                            valueLabelDisplay="auto"
                                            getAriaLabel={() => 'quest range'}
                                            onChangeCommitted={(event, value) => {
                                                questRangeSlider.current = value;
                                                setSettings({
                                                    ...settings,
                                                    chapter: {
                                                        min: value[0],
                                                        max: value[1],
                                                        auto_max: value[1] === data.quest.max_chapter,
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="mx-[5vw]">
                                    <Typography variant="button">
                                        Enabled Quest Difficulties
                                    </Typography>
                                    <div className="space-x-[3vw]">
                                        {_CONSTANTS.DIFFICULTY.map((diff) => {
                                            return (
                                                <Chip label={diff}
                                                    variant={settings?.disabled_difficulty?.[diff] ? "outlined"
                                                        : "filled"}
                                                    color="primary"
                                                    key={`quest-settings-difficulties-${diff}`}
                                                    onClick={() => {
                                                        setSettings({
                                                            ...settings,
                                                            disabled_difficulty: {
                                                                ...settings.disabled_difficulty,
                                                                [diff]: !(settings?.disabled_difficulty?.[diff]
                                                                    || false),
                                                            }
                                                        });
                                                    }} />
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="mx-[5vw]">
                                    <Typography variant="button">
                                        Ignored Item Rarities
                                    </Typography>
                                    <Grid className="max-w-[80vw]" container direction="row" gap={1}>
                                        {_CONSTANTS.RARITY.map((rarity) => {
                                            return (
                                                <Chip variant="outlined"
                                                    label={<QuestItemImage {...{id: `99${rarity}999`,
                                                        className: `h-8 w-8 ${settings?.ignored_rarity?.[rarity]
                                                            ? "opacity-50" : ""}`}} />}
                                                    key={`quest-settings-rarities-${rarity}`}
                                                    onClick={() => {
                                                        settingsBuild.current = true;
                                                        setSettings({
                                                            ...settings,
                                                            ignored_rarity: {
                                                                ...settings.ignored_rarity,
                                                                [rarity]: !(settings?.ignored_rarity?.[rarity]
                                                                    || false),
                                                            }
                                                        });
                                                    }} />
                                            );
                                        })}
                                    </Grid>
                                </div>
                                <div className="mx-[5vw]">
                                    <Typography variant="button">
                                        Specific Item Filter
                                        <IconButton aria-label="add filtered item"
                                            onClick={handleFilterModalOpen}>
                                            <AddIcon />
                                        </IconButton>
                                    </Typography>
                                    <Grid className="mt-2" container direction="row" gap={1}>
                                        {[...(settings?.item_filter || [])].map((id) => {
                                            return (
                                                <Chip variant="outlined"
                                                    label={<QuestItemImage {...{id, className: "h-8 w-8"}} />}
                                                    key={`quest-settings-item-filter-${id}`}
                                                    onDelete={() => {
                                                        setSettings({
                                                            ...settings,
                                                            item_filter: [
                                                                ...settings.item_filter.filter((item) => item !== id),
                                                            ],
                                                        });
                                                    }} />
                                            );
                                        })}
                                        {(!settings.item_filter || settings.item_filter.length <= 0)
                                            && <Alert severity="warning"> <strong>There are no filtered items. </strong>
                                            Click the <AddIcon /> button to add some.
                                        </Alert>}
                                    </Grid>
                                </div>
                            </Stack>
                        </Collapse>
                    </Paper>
                    {quests.length > 0 && <InfiniteScroll
                        pageStart={0}
                        loadMore={handleLoad}
                        hasMore={questDisplayCount < quests.length}
                        useWindow={false}
                        loader={<div key={0} className="text-center text-white my-10">
                            <CircularProgress disableShrink className="mb-3" color="warning" />
                            <p>Loading Quests...</p>
                        </div>}
                    >
                        {quests.slice(0, questDisplayCount)}
                    </InfiniteScroll>}
                    {quests.length <= 0 && <div className="h-[30vh]">
                        <Alert severity="error">
                            <AlertTitle>No Quests Available</AlertTitle>
                            Could not find any quests that contains <strong>required</strong> items.<br />
                            <div className="italic">
                                <div>• Make sure you have enabled projects that are <strong>not complete</strong>.</div>
                                <div>• Check your <strong>quest filter settings</strong> to allow for more quests.</div>
                            </div>
                        </Alert>
                    </div>}
                </Stack>
                <QuestModal {...{ questModalInfo }} />
                <FilterModal {...{ data, filterModalOpen, handleFilterModalClose, filterModalInfo }} />
          </Drawer>
        </>
    );
}

/**
 * HIGH COST QUEST LIST BUILDER.
 * GOES THROUGH ALL THE PROVIDED QUEST SCORES AND GENERATES AN ARRAY OF QUEST CARD JSX COMPONENTS.
 *
 * @param {Object} param0    OBJECT CONTAINING REQUIRED VARIABLES AND FUNCTIONS
 * @param {Object} param0.data    OBJECT CONTAINING ALL QUEST DATA
 * @param {Array} param0.quest_scores   ARRAY OF QUEST SCORES: [[QUEST_ID, SCORE], ...]
 * @param {Array} param0.priority_items    ARRAY OF ITEM IDS FROM PRIORITIZED PROJECTS: [ITEM_ID, ...]
 * @param {Object} param0.DIFFICULTY    OBJECT CONTAINING INFORMATION ABOUT DIFFICULTIES AND THEIR ACRONYM
 * @param {Function} param0.handleQuestModalOpen    FUNCTION TO OPEN THE QUEST MODAL
 * @returns ARRAY OF QUEST CARD JSX COMPONENTS
 */
function buildQuests({ data, required, quest_scores, priority_items, DIFFICULTY, handleQuestModalOpen }) {
    let quest_list = [];
    for (const [quest_id, quest_score] of quest_scores) {
        const quest_info = data.quest.data[quest_id];
        const is_normal = !quest_id.includes(DIFFICULTY.HARD) && !quest_id.includes(DIFFICULTY.EVENT);
        const is_hard = quest_id.includes(DIFFICULTY.HARD) && !quest_id.includes(DIFFICULTY.VERY_HARD);
        const is_very_hard = quest_id.includes(DIFFICULTY.VERY_HARD);
        const is_event = quest_id.includes(DIFFICULTY.EVENT);

        quest_list.push(
            <QuestCard key={`quest--${quest_id}-${quest_score}`} />
        );

        function is_priority(item_id) {
            return priority_items.includes(item_id) && is_required(item_id);
        }

        function is_required(item_id) {
            return required.hasOwnProperty(item_id);
        }

        function QuestCard() {
            const gradient = "bg-gradient-to-r " + (quest_score >= 7.2
                ? 'from-green-300'
                : quest_score >= 3.6
                    ? 'from-yellow-300'
                    : 'from-red-300');
            const QuestCardAvatar = () => {
                return (
                    <Grid className="quest-card--avatar" container justifyContent="center" alignItems="center"
                        direction="row" gap={1}>
                        <div className="quest-card--avatar-text">
                            {is_normal && quest_id}
                            {is_hard && <>
                                {quest_id.replace(DIFFICULTY.HARD, "")} <span className="text-red-300">
                                    {DIFFICULTY.HARD}</span>
                            </>}
                            {is_very_hard && <>
                                {quest_id.replace(DIFFICULTY.VERY_HARD, "")} <span className="text-purple-300">
                                    {DIFFICULTY.VERY_HARD}</span>
                            </>}
                            {is_event && <>
                                {quest_id.replace(DIFFICULTY.EVENT, "")} <span className="text-yellow-300">
                                    {DIFFICULTY.EVENT}</span>
                            </>}
                        </div>
                        {quest_info.memory_piece.item !== "999999" &&
                            <QuestItemImage {...{ id: quest_info.memory_piece.item,
                                priority: is_priority(quest_info.memory_piece.item),
                                disabled: !is_required(quest_info.memory_piece.item),
                                className: "quest-item--memory-piece dark-shadow-md rounded z-0" }} />
                        }
                    </Grid>
                );
            };
            const QuestCardTitle = () => {
                return (
                    <strong>{quest_info.name}</strong>
                );
            };
            const QuestCardSubheader = () => {
                return (
                    <span>
                        {`${quest_score} pts • ${quest_info.stamina} stamina`}
                    </span>
                );
            };
            const QuestCardMainItems = ({ showDropRate }) => {
                return (
                    <div className="main-drops">
                        {quest_info.drops.map((drop, index) => {
                            const id = drop.item;
                            return (
                                <div className="inline-block" key={`quest-main-item--${id}-${index}`}>
                                    <QuestItemImage {...{ id,
                                        priority: is_priority(id),
                                        disabled: !is_required(id) }} />
                                    <div className={`${(is_required(id) || showDropRate)
                                        ? "visible" : "invisible"} font-bold text-center font-mono mr-1`}>
                                        {drop.drop_rate}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            };
            const QuestCardSubItems = ({ showDropRate }) => {
                return (
                    <div className="sub-drops">
                        {quest_info.subdrops.map((drop, index) => {
                            const id = drop.item;
                            return (
                                <div className="inline-block" key={`quest-sub-item--${id}-${index}`}>
                                    <QuestItemImage {...{ id,
                                        priority: is_priority(id),
                                        disabled: !is_required(id) }} />
                                    <div className={`${(is_required(id) || showDropRate)
                                        ? "visible" : "invisible"} font-bold text-center font-mono mr-1`}>
                                        {drop.drop_rate}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            };
            return (
                <>
                    <Card className={`quest-card ${gradient}`} key={`quest--${quest_id}-${quest_score}`}>
                        <CardHeader
                            avatar={<QuestCardAvatar />}
                            title={<QuestCardTitle />}
                            subheader={<QuestCardSubheader />}
                            action={
                                <IconButton aria-label="expand project" onClick={() => {
                                    handleQuestModalOpen({
                                        quest_info,
                                        is_priority,
                                        is_required,
                                        QuestCardAvatar,
                                        QuestCardTitle,
                                        QuestCardSubheader,
                                    });
                                }}>
                                    <OpenInFullIcon />
                                </IconButton>
                            }
                        />
                        <CardContent className="my-[-5mm]">
                            <QuestCardMainItems />
                            <QuestCardSubItems />
                        </CardContent>
                    </Card>
                </>
            );
        }
    }
    return quest_list;
}

/**
 * HANDLES THE QUEST MODAL.
 * THE QUEST MODAL IS OPENED WHEN THE "EXPAND-ALL" BUTTON FROM THE QUEST LIST IS CLICKED ON.
 * THE QUEST MODAL WILL DISPLAY ALL ITEM DROP RATES AND THE USER'S INVENTORY AND REQUIRED ITEMS.
 * THE USER MAY ALSO EDIT THEIR INVENTORY FROM HERE, AND QUESTS WILL BE UPDATED IF THE INVENTORY IS CHANGED.
 *
 * @param {Object} param0                   OBJECT CONTAINING THE FOLLOWING PROPERTIES
 * @param {Object} param0.questModalInfo    REF THAT HAS IMPORTANT INFORMATION FOR THE QUEST MODAL
 * @returns QUEST MODAL JSX COMPONENT
 */
function QuestModal({ questModalInfo }) {
    const { quest_info, is_priority, is_required,
        userState, handleInventoryChange, builtQuestInfo,
        questModalOpen, handleQuestModalClose,
        QuestCardAvatar, QuestCardTitle, QuestCardSubheader } = questModalInfo.current;
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const menuEditInfo = useRef({});
    const [editInputNumber, setEditInputNumber] = useState(0);

    function handleMenuClick(event, id) {
        setAnchorEl(event.currentTarget);
        menuEditInfo.current = {
            id,
            amount: userState.inventory[id] || 0,
        };
        setEditInputNumber(menuEditInfo.current.amount);
    }

    function handleMenuClose() {
        setAnchorEl(null);
        if (menuEditInfo.current.amount === userState.inventory[menuEditInfo.current.id]) {
            // no changes
            return;
        }
        handleInventoryChange(menuEditInfo.current);
    }

    if (Object.keys(questModalInfo.current).length === 0) {
        // need to leave early if modal data isn't ready yet
        return (<></>);
    }
    let index = 0;
    let table_data = {
        image: [],
        drop_rate: [],
        inventory: [],
        required: [],
        priority_amount: [],
    };
    for (const drop of [quest_info.memory_piece, ...quest_info.drops, ...quest_info.subdrops]) {
        const id = drop.item;
        if (id === "999999") {
            continue;
        }
        table_data.image.push(
            <TableCell align="center" key={`quest-table-cell--item-${id}-${index}`}>
                <button className="h-12 w-12 inline-block" onClick={(event) => handleMenuClick(event, id)}>
                    <QuestItemImage {...{ id,
                        priority: is_priority(id),
                        disabled: !is_required(id) }}
                        className="rounded" />
                </button>
            </TableCell>
        );
        table_data.drop_rate.push(
            <TableCell align="center"
                key={`quest-table-cell--droprate-${id}-${index}`}
            >
                {drop.drop_rate}%
            </TableCell>
        );
        table_data.inventory.push(
            <TableCell className={`${userState.inventory[id] ? "" : "opacity-50"}`} align="center"
                key={`quest-table-cell--inventory-${id}-${index}`}
            >
                ×{userState.inventory[id] || 0}
            </TableCell>
        );
        table_data.required.push(
            <TableCell align="center"
                key={`quest-table-cell--required-${id}-${index}`}
            >
                <span className={`${builtQuestInfo.current.required[id] ? "text-red-600 font-bold" : "opacity-50"}`}>
                    {builtQuestInfo.current.required[id] || builtQuestInfo.current.required_clean[id]
                    ? `${builtQuestInfo.current.required[id] || 0} / ${builtQuestInfo.current.required_clean[id]}`
                    : 0}
                </span>
            </TableCell>
        );
        table_data.priority_amount.push(
            <TableCell className={`${builtQuestInfo.current.priority_amount[id] ? "" : "opacity-50"}`} align="center"
                key={`quest-table-cell--priority-${id}-${index}`}
            >
                ×{builtQuestInfo.current.priority_amount[id] || 0}
            </TableCell>
        );
        index++;
    }
    return (
        <Modal
            open={questModalOpen}
            onClose={() => handleQuestModalClose(false)}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500,
            }}
        >
            <Fade in={questModalOpen}>
                <Box sx={MODAL_STYLE} className="w-[85vw] standard-font text-center">
                    <Grid container direction="column" alignItems="center" justifyContent="center" gap={1}>
                        <div className="w-full text-left">
                            <Card className="w-fit text-left inline-block mr-2">
                                <CardHeader
                                    avatar={<QuestCardAvatar />}
                                    title={<QuestCardTitle />}
                                    subheader={<QuestCardSubheader />}
                                />
                            </Card>
                        </div>
                        <Alert severity="info">
                            Click on an item to edit your inventory.
                        </Alert>
                        <TableContainer component={Paper}>
                            <Table sx={{minWidth: "fit-content"}}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Quest Items</TableCell>
                                        {table_data.image}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell component="th" scope="row">
                                            Drop Rate
                                        </TableCell>
                                        {table_data.drop_rate}
                                    </TableRow>
                                </TableBody>
                                <TableBody>
                                    <TableRow>
                                        <TableCell component="th" scope="row">
                                            Inventory
                                        </TableCell>
                                        {table_data.inventory}
                                    </TableRow>
                                </TableBody>
                                <TableBody>
                                    <TableRow>
                                        <TableCell component="th" scope="row">
                                            Required
                                        </TableCell>
                                        {table_data.required}
                                    </TableRow>
                                </TableBody>
                                <TableBody>
                                    <TableRow>
                                        <TableCell component="th" scope="row">
                                            Priority Required
                                        </TableCell>
                                        {table_data.priority_amount}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Menu open={menuOpen} anchorEl={anchorEl} onClose={handleMenuClose}>
                        <Typography sx={{marginLeft: "1vw"}} variant="button">
                            Edit Inventory
                        </Typography>
                        <InputNumber className="m-1"
                                autoFocus max={_CONSTANTS.INVENTORY.FRAGMENT_MAX} min={0}
                                value={editInputNumber} onChange={(value) => {
                                    menuEditInfo.current = {
                                        ...menuEditInfo.current,
                                        amount: value,
                                    };
                                    setEditInputNumber(value);
                                }}
                                key={`quest-inventory-edit-${menuEditInfo.current?.amount}`} />
                        {[[10, 5, 1], [-10, -5, -1]].map(([x, y, z]) => {
                            function addValue(value) {
                                menuEditInfo.current.amount += value;
                                if (menuEditInfo.current.amount < 0) {
                                    menuEditInfo.current.amount = 0;
                                }
                                if (menuEditInfo.current.amount > _CONSTANTS.INVENTORY.FRAGMENT_MAX) {
                                    menuEditInfo.current.amount = _CONSTANTS.INVENTORY.FRAGMENT_MAX;
                                }
                                setEditInputNumber(menuEditInfo.current.amount);
                            }
                            return (
                                <Grid container orientation="row" justifyContent="center" alignItems="center"
                                    key={`quest-inventory-edit-buttons-${x}-${y}-${z}`}
                                >
                                    <Button variant="outlined" color={x > 0 ? "success" : "error"}
                                        onClick={() => {
                                            addValue(x);
                                        }
                                    }>{x > 0 ? `+${x}` : x}</Button>
                                    <Button variant="outlined" color={y > 0 ? "success" : "error"}
                                        onClick={() => {
                                            addValue(y);
                                        }
                                    }>{y > 0 ? `+${y}` : y}</Button>
                                    <Button variant="outlined" color={z > 0 ? "success" : "error"}
                                        onClick={() => {
                                            addValue(z);
                                        }
                                    }>{z > 0 ? `+${z}` : z}</Button>
                                </Grid>
                            );
                        })}
                    </Menu>
                    <Button className="mt-3 w-full" variant="outlined" color="error"
                        onClick={() => handleQuestModalClose(false)}>
                        Close
                    </Button>
                </Box>
            </Fade>
        </Modal>
    );
}

/**
 * HANDLES THE FILTER MODAL.
 * THE FILTER MODAL IS A MODAL THAT CONTAINS A CATEGORY OF ITEM FRAGMENTS THAT A USER CAN CLICK TO FILTER FOR
 * SPECIFIC QUEST ITEMS.
 * QUESTS THAT DON'T HAVE FILTERED ITEMS ARE IGNORED.
 *
 * @param {Object} param0    OBJECT WITH THE FOLLOWING PROPERTIES
 * @param {Object} param0.data    OBJECT CONTAINING EQUIPMENT/QUEST/ITEM DATA
 * @param {boolean} param0.filterModalOpen    BOOLEAN INDICATING IF THE FILTER MODAL IS OPEN
 * @param {function} param0.handleFilterModalClose    FUNCTION TO HANDLE THE FILTER MODAL CLOSE
 * @param {Object} param0.filterModalInfo    REF THAT HAS THE CURRENT FILTER SETTINGS
 * @returns FILTER MODAL JSX COMPONENT
 */
 function FilterModal({ data, filterModalOpen, handleFilterModalClose, filterModalInfo }) {
    const [count, setCount] = useState(-1); // nothing that important, just used to update the modal when count changes

    /**
     * TRIGGERS WHEN THE FILTER MODAL OPENS.
     * RESETS THE count STATE BACK TO -1 SO THE MODAL WILL UPDATE PROPERLY.
     */
    useEffect(() => {
        if (!filterModalOpen) {
            return;
        }
        setCount(count - 999999);
    }, [count, filterModalOpen]);

    /**
     * HANDLES WHEN AN ITEM BUTTON FROM THE ITEM CATEGORY IS CLICKED.
     * ADDS THE ITEM TO THE CURRENT FILTER SETTINGS.
     * @param {String} id    ITEM ID; I.E. "101011"
     */
    function handleClick(id) {
        if (!filterModalInfo.current.includes(id)) {
            filterModalInfo.current.push(id);
            setCount(filterModalInfo.current.length);
        }
    }
    return (
        <Modal
            open={filterModalOpen}
            onClose={handleFilterModalClose}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500,
            }}
        >
            <Fade in={filterModalOpen}>
                <Box sx={MODAL_STYLE} className="max-w-[85vw] standard-font text-center">
                    <Grid container direction="column" alignItems="center" justifyContent="center" gap={1.5}>
                        <Grid container direction="row" alignItems="center" justifyContent="center" gap={1}>
                            {filterModalInfo.current.map((id, index) => {
                                return (
                                    <Chip variant="outlined"
                                        label={<QuestItemImage {...{id, className: "h-8 w-8"}} />}
                                        key={`quest-settings-item-filter-${id}`}
                                        onDelete={() => {
                                            filterModalInfo.current = [
                                                ...filterModalInfo.current.slice(0, index),
                                                ...filterModalInfo.current.slice(index + 1),
                                            ];
                                            setCount(filterModalInfo.current.length);
                                        }} />
                                );
                            })}
                        </Grid>
                        <div className="max-w-[70vw]">
                            <ItemCatalog {...{ data, callback: handleClick,
                                keyPrefix: "filter-modal",
                                hidden: !filterModalOpen,
                                includeFragment: true, onlyFragment: true }} />
                        </div>
                    </Grid>
                </Box>
            </Fade>
        </Modal>
    );
}

/**
 * BASIC IMAGE FOR QUEST ITEMS IN THE QUEST LIST.
 *
 * @param {Object} param0              OBJECT WITH THE FOLLOWING PROPERTIES
 * @param {String} param0.id           ITEM ID; I.E. "101011"
 * @param {boolean} param0.priority    BOOLEAN INDICATING IF THE ITEM IS A PRIORITY ITEM
 * @param {boolean} param0.disabled    BOOLEAN INDICATING IF THE ITEM IS DISABLED (NOT REQUIRED)
 * @param {String} param0.className    ADDITIONAL CSS CLASS NAMES
 * @returns ITEM IMAGE JSX COMPONENT
 */
function QuestItemImage({ id, priority = false, disabled = false, className = "" }) {
    // most css done in QuestDrawer.css
    return (
        <img src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
            className={`${priority ? "quest-item--priority" : ""} ${disabled
                ? "quest-item--disabled" : ""} dark-shadow-md ${className}`}
            alt={`quest item ${id}`} key={`quest item ${id}`} />
    );
}