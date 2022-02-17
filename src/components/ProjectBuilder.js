import React, { useState, useRef, useEffect } from 'react';
import Button from '@mui/material/Button';

import InputNumber from 'rc-input-number';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Avatar from '@mui/material/Avatar';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import CharacterCatalog from './CharacterCatalog';
import ItemButton from './ItemButton';
import AvatarGroup from '@mui/material/AvatarGroup';
import _CONSTANTS from '../scripts/constants';

export default function ProjectBuilder({ data, userState, userDispatch }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);
    const project = useRef({});

    function openModal() {
        setStep(0);
        setOpen(true);
    }

    function closeModal() {
        setOpen(false);
    }

    return (
        <>
            <Button variant="contained" className="m-3"
                onClick={openModal}
                endIcon={<img className="h-8" src={`${process.env.PUBLIC_URL}/images/webpage/projects.png`} alt={'new project'} />}
            >
                New Project
            </Button>
            <Modal
                open={open}
                onClose={closeModal}
                closeAfterTransition
                keepMounted
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={open}>
                    <Box sx={MODAL_STYLE} className="w-[75vw] standard-font text-center">
                        {step !== 0 &&
                            <Stepper activeStep={step} className="mb-4" alternativeLabel>
                                <Step><StepLabel>Choose Project Type</StepLabel></Step>
                                {(step !== 0 && project.current.type === "character") &&
                                    <Step><StepLabel>Choose Character</StepLabel></Step>
                                }
                                {(step !== 0 && project.current.type === "item") &&
                                    <Step><StepLabel>Choose Items</StepLabel></Step>
                                }
                                <Step><StepLabel>Edit Project Details</StepLabel></Step>
                            </Stepper>
                        }
                        {step === 0 && <ChooseType {...{setStep, project}} />}
                        <ChooseCharacter {...{data, setStep, project, hidden: (step !== 1 || project.current.type !== "character") }} />
                        <ChooseItem {...{data, setStep, project, hidden: (step !== 1 || project.current.type !== "item") }} />
                        {(step === 2 && project.current.type === "character") && <EditCharacterProjectDetails {...{data, userState, userDispatch, closeModal, setStep, project}} />}
                        {(step === 2 && project.current.type === "item") && <EditItemProjectDetails {...{data, userState, userDispatch, closeModal, setStep, project}} />}
                    </Box>
                </Fade>
            </Modal>
        </>
    );
}

// STEP 0
function ChooseType({ setStep, project }) {
    const css = "w-full h-[30vh] text-3xl";
    return (
        <>
            <Alert severity="info" className="text-left mb-4">
                Choose the type of project you want to create.
            </Alert>
            <Grid
                    container
                    direction="column"
                    alignItems="center"
                    justifyContent="center"
                    gap={1}>
                <Button className={css}
                    variant="contained"
                    color="warning"
                    onClick={() => {
                        // NEED TO CLONE LIKE THIS TO MAKE SURE PROJECT_TEMPLATE WILL NEVER BE MODIFIED
                        project.current = JSON.parse(JSON.stringify(PROJECT_TEMPLATE.character));
                        setStep(1);
                    }}
                    startIcon={<img className="h-16" src={`${process.env.PUBLIC_URL}/images/webpage/CharacterProject.png`} alt={'character'} />}
                >Character</Button>
                <Button className={css}
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                        // NEED TO CLONE LIKE THIS TO MAKE SURE PROJECT_TEMPLATE WILL NEVER BE MODIFIED
                        project.current = JSON.parse(JSON.stringify(PROJECT_TEMPLATE.item));
                        setStep(1);
                    }}
                    startIcon={<img className="h-10" src={`${process.env.PUBLIC_URL}/images/webpage/ItemProject.png`} alt={'item'} />}
                >Item</Button>
            </Grid>
        </>
    );
}

// STEP 1 (CHARACTER)
function ChooseCharacter({ data, setStep, project, hidden }) {
    const renderRef = useRef(false);

    // IF ELEMENT HAS NOT BEEN RENDERED YET, MAKE IT STAY HIDDEN
    if (!renderRef.current && hidden) {
        return (<></>);
    }
    if (!renderRef.current) {
        // KEEP THIS ELEMENT RENDERED BECAUSE OF THE CHARACTER CATALOG
        renderRef.current = true;
    }
    return (
        <Grid
            hidden={hidden}
            container
            direction="column"
            alignItems="center"
            justifyContent="center"
            gap={1}>
            <div className="overflow-y-auto max-h-[70vh]" hidden={hidden}>
                <CharacterCatalog {...{data, callback: onCharacterSelect, keyPrefix: "project-builder" }} />
            </div>
            <Button className="w-full" variant="outlined" color="error" onClick={() => setStep(0)}>
                Cancel
            </Button>
        </Grid>
    );
    function onCharacterSelect(id) {
        project.current = {
            ...project.current,
            date: `${Date.now()}`, // used as project id
            details: {
                ...project.current.details,
                avatar_id: id,
                formal_name: `${data.character.data[id].name} (${id})`,
            }
        };
        setStep(2);
    }
}

function ChooseItem({ data, setStep, project, hidden }) {
    const MAX_AVATARS = 3;
    const MAX_ITEMS = 99;
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [projectItems, setProjectItems] = useState([]);
    const items = useRef(new Map());
    const avatars = useRef(new Map());
    const renderRef = useRef(false);
    const builtRef = useRef(false);

    useEffect(() => {
        if (!renderRef.current && hidden) {
            return;
        }
        if (builtRef.current) {
            return;
        }
        builtRef.current = true;

        // USE setTimeout HERE SO WE CAN DISPLAY A SPINNER WHILE OUR COMPONENT LOADS
        setTimeout(() => {
            console.log("build item catalog");
            const tItems = new Map(), tAvatars = new Map();
            Object.entries(data.equipment.data).forEach(([id, value]) => {
                const entry = <ItemButton {...{
                    id,
                    quantity: 0,
                    ignore_quantity: true,
                    callback: () => handleItemCatalogClick(id),
                }} key={`project-builder-inventory-catalog--${id}`} />;
                const avatar = <Avatar {...{
                    src: `${process.env.PUBLIC_URL}/images/items/${id}.png`,
                    variant: "rounded",
                }} alt={`item ${id}`} key={`project-builder-inventory-catalog-avatar--${id}`} />
                if (tItems.has(value.rarity)) {
                    tItems.get(value.rarity).push(entry);
                    if (tAvatars.get(value.rarity).length < MAX_AVATARS) {
                        tAvatars.get(value.rarity).push(avatar);
                    }
                    return;
                }
                tItems.set(value.rarity, [entry]);
                tAvatars.set(value.rarity, [avatar]);
            });
            items.current = new Map([...tItems.entries()].sort((a, b) => a[0] - b[0]));; // sort by rarity low -> high
            avatars.current = new Map([...tAvatars.entries()].sort((a, b) => a[0] - b[0])); // sort by rarity low->high
            setLoading(false);
        });
    }, [hidden]);

    // IF ELEMENT HAS NOT BEEN RENDERED YET, MAKE IT STAY HIDDEN
    if (!renderRef.current && hidden) {
        return (<></>);
    }
    if (!renderRef.current) {
        // KEEP THIS ELEMENT RENDERED BECAUSE OF THE ITEM CATALOG
        renderRef.current = true;
    }

    const PROJECT_LENGTH = Object.keys(project.current.required).length;

    return (
        <>
            <Grid
                hidden={hidden}
                container
                direction="column"
                alignItems="center"
                justifyContent="center"
                className="mb-3"
                gap={2}>
                <Alert severity="info" className="text-left w-full">
                    Click on an item in the <strong>Item Catalog</strong> to add it to your project.<br />
                    Click on an item under <strong>Project Details</strong> to remove one copy.<br />
                    One item can only have a maximum quantity of <strong><code>{MAX_ITEMS}</code></strong> per project.
                </Alert>
                <div className="w-full">
                    <Divider textAlign="left">Project Details</Divider>
                    <div className="overflow-y-auto py-3 rounded bg-black/[0.1] mb-2 max-h-[30vh] min-h-[56px]">
                        {PROJECT_LENGTH <= 0 ?
                            <span className="italic">No items selected...</span>
                            :
                            <Grid container direction="row" justifyContent="center"
                                alignItems="center" gap={0.3}>{projectItems}</Grid>
                        }
                    </div>
                    <Button color="warning" disabled={PROJECT_LENGTH <= 0}
                        onClick={() => {
                            project.current.required = {};
                            buildProjectDetails();
                        }}>
                        Clear all items
                    </Button>
                    <Divider className="mt-3" textAlign="left">Item Catalog</Divider>
                    {!hidden && !loading &&
                        <Tabs variant="scrollable"
                            scrollButtons="auto"
                            allowScrollButtonsMobile
                            onChange={(event, value) => {
                                setTab(value);
                            }}
                            value={tab}>
                            {[...avatars.current.keys()].map((rarity) => {
                                return <Tab icon={
                                    <AvatarGroup max={MAX_AVATARS}>
                                        {avatars.current.get(rarity)}
                                    </AvatarGroup>
                                } key={`project-builder-inventory-catalog-rarity-tab--${rarity}`} />;
                            })}
                        </Tabs>
                    }
                    <div className="overflow-y-auto max-h-[30vh] min-h-[56px]">
                        {loading && <CircularProgress disableShrink color="secondary" />}
                        {!loading && <div>
                            <Grid
                                container
                                direction="row"
                                alignItems="center"
                                justifyContent="center"
                                className="max-h-[20vh]"
                                gap={0.5}>
                                {Array.from(items.current.values())[tab]}
                            </Grid>
                        </div>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-1 w-full">
                    <Button variant="outlined" color="error" onClick={() => setStep(0)}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="primary" disabled={PROJECT_LENGTH <= 0}
                        onClick={() => {
                            setStep(2);
                            project.current = {
                                ...project.current,
                                date: `${Date.now()}`, // used as project id
                            };
                    }}>
                        Next
                    </Button>
                </div>
            </Grid>
        </>
    );
    function handleItemCatalogClick(id) {
        project.current = {
            ...project.current,
            required: {
                ...project.current.required,
                [id]: project.current.required[id] ? project.current.required[id] + 1 : 1,
            },
        };
        if (project.current.required[id] > MAX_ITEMS) {
            project.current.required[id] = MAX_ITEMS;

            // PROBABLY DON'T NEED TO UPDATE PROJECT DETAILS IF NOTHING CHANGED
            return;
        }
        buildProjectDetails();
    }
    function handleProjectDetailsClick(id) {
        project.current = {
            ...project.current,
            required: {
                ...project.current.required,
                [id]: project.current.required[id] - 1,
            },
        };
        if (project.current.required[id] <= 0) {
            delete project.current.required[id];
        }
        buildProjectDetails();
    }
    function buildProjectDetails() {
        let tProjectItems = [];
        Object.entries(project.current.required).forEach(([id, quantity]) => {
            tProjectItems.push(
                <ItemButton {...{
                    id,
                    quantity,
                    callback: () => handleProjectDetailsClick(id),
                }} key={`project-builder-item-project-details--${id}`} />
            );
        });
        setProjectItems(tProjectItems);
    }
}

// STEP 2 (CHARACTER)
function EditCharacterProjectDetails({ data, userState, userDispatch, closeModal, setStep, project }) {
    const [startRank, setStartRank] = useState(project.current.details.start.rank);
    const [endRank, setEndRank] = useState(project.current.details.end.rank);
    const [alert, setAlert] = useState("");
    const [_forceRender, _setForceRender] = useState(false);
    const projectName = useRef("");
    const avatar_id = project.current.details.avatar_id;
    return (
        <Grid
            container
            direction="column"
            alignItems="center"
            justifyContent="center"
            gap={1}>
            <Grid
                container
                direction="row"
                alignItems="center"
                justifyContent="center"
                gap={1}
                className="font-extrabold text-md sm:text-2xl">
                <Avatar src={`${process.env.PUBLIC_URL}/images/unit_icon/${avatar_id}.png`} alt={`character ${avatar_id}`}
                    sx={{ width: 48, height: 48 }} />
                <div>{data.character.data[avatar_id].name}</div>
            </Grid>
            <Collapse in={alert !== ""}>
                <Alert severity="error" className="text-left">
                    <AlertTitle>Invalid Project Error</AlertTitle>
                    {alert}
                </Alert>
            </Collapse>
            <TextField
                label="Project Name"
                helperText="Optional"
                variant="outlined"
                autoComplete="off"
                inputRef={projectName} />
            <div className="w-full space-y-3 mb-2">
                <Divider textAlign="left">Start Details</Divider>
                <div className="space-y-3">
                    <InputNumber
                        min={1}
                        max={data.character.max_rank}
                        value={startRank}
                        onChange={(value) => {
                            project.current.details.start = {
                                ...project.current.details.start,
                                rank: value,
                                equipment: [false, false, false, false, false, false],
                            };
                            updateStartRank(value);
                        }}
                        formatter={inputFormat}
                        parser={inputParser}
                    />
                    <RankItems {...{unitDetails: project.current.details.start}} />
                    <Button
                        disabled={!userState.character[avatar_id]}
                        color="warning"
                        onClick={() => {
                            // MAKE A COPY OF THE CHARACTER BECAUSE userState WILL BE MODIFIED OTHERWISE
                            const savedRank = userState.character[avatar_id].rank;
                            project.current.details.start = {
                                ...project.current.details.start,
                                rank: savedRank,
                                // need to clone array like this else userState is modified
                                equipment: [...userState.character[avatar_id].equipment],
                            };
                            updateStartRank(savedRank);
                            if (startRank === savedRank) {
                                // FORCE RENDER, BECAUSE ITEMS WON'T UPDATE OTHERWISE IF RANKS HAVEN'T CHANGED
                                _setForceRender(!_forceRender);
                            }
                        }}
                    >
                        Use Saved Character
                    </Button>
                </div>
                <Divider textAlign="left">End Details</Divider>
                <div className="space-y-3">
                    <InputNumber
                        min={startRank}
                        max={data.character.max_rank}
                        value={endRank}
                        onChange={(value) => {
                            project.current.details.end = {
                                ...project.current.details.end,
                                rank: value,
                                equipment: [false, false, false, false, false, false],
                            };
                            if (startRank === value) {
                                // SINCE START RANK IS THE SAME, END RANK CAN NOT HAVE MISSING START ITEMS
                                project.current.details.end.equipment = [...project.current.details.start.equipment];
                            }
                            setEndRank(value);
                        }}
                        formatter={inputFormat}
                        parser={inputParser}
                    />
                    <RankItems {...{unitDetails: project.current.details.end}} />
                </div>
                <Divider textAlign="left">Additional Details</Divider>
                <div className="space-y-3">
                    <IgnoredRarities {...{ project }} />
                    <AddMemoryPiece {...{ project }} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-1 w-full">
                <Button variant="outlined" color="error" onClick={() => {
                    setStep(1);
                    // RESET START/END DETAILS
                    project.current.details = {
                        ...project.current.details,
                        start: {
                            ...project.current.details.start,
                            rank: 1,
                            equipment: [false, false, false, false, false, false],
                        },
                        end: {
                            ...project.current.details.end,
                            rank: 1,
                            equipment: [false, false, false, false, false, false],
                        },
                    };
                    // DELETE MEMORY PIECES AND IGNORED RARITIES
                    delete project.current.details.memory_piece;
                    delete project.current.details.pure_memory_piece;
                    delete project.current.details.ignored_rarity;
                }}>
                    Change Character
                </Button>
                <Button variant="contained" color="primary" onClick={() => {
                    if (validateProject()) {
                        console.log("update project stuff here + move to next step, btw using project name", projectName.current.value);
                        if (!buildRequiredItems()) {
                            setAlert("Resulting project has no required items.");
                            return;
                        }
                        if (projectName.current.value !== "") {
                            project.current.details.name = projectName.current.value;
                        }

                        // PROJECT IS TECHNICALLY DONE
                        userDispatch({
                            type: "SET_PROJECTS",
                            payload: [...userState.projects, project.current],
                        });
                        console.log([...userState.projects, project.current]);
                        closeModal();
                    }
                }}>
                    Create Project
                </Button>
            </div>
        </Grid>
    );

    function AddMemoryPiece({ project }) {
        const [memoryPiece, setMemoryPiece] = useState(project.current.details.memory_piece || 0);
        const [pureMemoryPiece, setPureMemoryPiece] = useState(project.current.details.pure_memory_piece || 0);
        const regular = `3${(project.current.details.avatar_id).substring(0, 4)}`;
        const pure = `32${(project.current.details.avatar_id).substring(1, 4)}`;
        const regularExists = data.equipment.data[regular] !== undefined;
        const pureExists = data.equipment.data[pure] !== undefined;
        if (!(regularExists || pureExists)) {
            return (<></>);
        }
        return (
            <Grid container direction="column" justifyContent="center" alignItems="center" gap={1}>
                <Typography sx={{ display: "block" }} variant="button">
                    Add Memory Piece
                </Typography>
                {regularExists && <Grid container direction="row" justifyContent="center" alignItems="center" gap={1}>
                    <img className="w-10 h-10 inline-block" src={`${process.env.PUBLIC_URL}/images/items/${regular}.png`}
                        alt={`memory piece`} />
                    <InputNumber
                        className="inline-block"
                        min={0}
                        max={_CONSTANTS.INVENTORY.FRAGMENT_MAX}
                        defaultValue={0}
                        value={memoryPiece}
                        onChange={(value) => {
                            project.current.details.memory_piece = value;
                            setMemoryPiece(value);
                        }}
                    />
                </Grid>}
                {pureExists && <Grid container direction="row" justifyContent="center" alignItems="center" gap={1}>
                    <img className="w-10 h-10 inline-block" src={`${process.env.PUBLIC_URL}/images/items/${pure}.png`}
                        alt={`pure memory piece`} />
                    <InputNumber
                        className="inline-block"
                        min={0}
                        max={_CONSTANTS.INVENTORY.FRAGMENT_MAX}
                        defaultValue={0}
                        value={pureMemoryPiece}
                        onChange={(value) => {
                            project.current.details.pure_memory_piece = value;
                            setPureMemoryPiece(value);
                        }}
                    />
                </Grid>}
            </Grid>
        );
    }

    function validateProject() {
        // MAKE SURE THERE'S AT LEAST ONE ITEM IN THE PROJECT
        const memory_piece = project.current.details.memory_piece || 0;
        const pure_memory_piece = project.current.details.pure_memory_piece || 0;
        const start = project.current.details.start;
        const end = project.current.details.end;
        const startCount = start.equipment.filter(Boolean).length;
        const endCount = end.equipment.filter(Boolean).length;
        if (start.rank === end.rank) {
            // MAKE SURE ALL START ITEMS ARE SELECTED IN END ITEMS
            for (let i = 0 ; i < 6 ; i++) {
                if (start.equipment[i] && !end.equipment[i]) {
                    setAlert("End result is missing items that start has.");
                    return false;
                }
            }
            if (memory_piece + pure_memory_piece >= 1) {
                // memory pieces exist
                return true;
            }
            // AT LEAST ONE NEW ITEM NEEDS TO BE SELECTED
            if (startCount >= endCount) {
                setAlert("Start has more or equal items than the end result.");
                return false;
            }
        }
        else if (start.rank + 1 === end.rank && startCount === 6 && endCount === 0) {
            // MAKE SURE START RANK ISN'T 6 ITEMS AND END RANK IS 0 SELECTED
            setAlert("No new items are selected in end result.");
            return false;
        }

        // PROJECT SUCCESSFULLY VERIFIED
        return true;
    }

    function buildRequiredItems() {
        const start = project.current.details.start;
        const end = project.current.details.end;
        const avatarID = project.current.details.avatar_id;

        console.time("build_character_project");
        let items = {}, itemID, counter = 0;
        for (let i = start.rank ; i <= end.rank ; i++) {
            for (let j = 0 ; j < 6 ; j++) {
                itemID = data.character.data[avatarID].equipment[`rank_${i}`]
                    ? data.character.data[avatarID].equipment[`rank_${i}`][j] : "999999";
                if (itemID === "999999") {
                    // IGNORE PLACEHOLDER/MISSING ITEMS
                    continue;
                }
                if (start.rank === end.rank) {
                    // START RANK AND END RANK IS THE SAME
                    // ADD WHATEVER ITEM START DOESN'T HAVE BUT END DOES
                    // WE CAN ASSUME THAT END HAS EVERY ITEM THAT START HAS
                    if (!start.equipment[j] && end.equipment[j]) {
                        increment();
                    }
                }
                else if (i === end.rank && end.equipment[j]) {
                    // WE ARE LOOKING AT THE END RANK
                    // ONLY ADD ITEMS THAT ARE SELECTED
                    increment();
                }
                else if (i < end.rank) {
                    if (i === start.rank && start.equipment[j]) {
                        // WE ARE LOOKING AT THE START RANK
                        // IGNORE ITEMS THAT START ALREADY HAS
                        continue;
                    }
                    increment();
                }
            }
        }

        // append memory pieces
        const memory_piece = project.current.details.memory_piece || 0;
        const pure_memory_piece = project.current.details.pure_memory_piece || 0;
        if (memory_piece > 0) {
            console.log("adding memory pieces", memory_piece);
            const regular = `3${(project.current.details.avatar_id).substring(0, 4)}`;
            items = {
                ...items,
                [regular]: memory_piece,
            };
            counter += memory_piece;
            //delete project.current.details.memory_piece;
        }
        if (pure_memory_piece > 0) {
            const pure = `32${(project.current.details.avatar_id).substring(1, 4)}`;
            items = {
                ...items,
                [pure]: pure_memory_piece,
            };
            counter += pure_memory_piece;
            //delete project.current.details.pure_memory_piece;
        }
        console.timeEnd("build_character_project");
        console.table(items);
        console.log("total items:", counter);
        project.current.required = items;

        return counter > 0;

        function increment() {
            items[itemID] = items[itemID] ? items[itemID] + 1 : 1;
            counter++;
        }
    }

    function updateStartRank(value) {
        // START RANK MUST BE LOWER OR EQUAL TO END RANK
        setStartRank(value);
        if (endRank < value) {
            setEndRank(value);
            // MODIFY PROJECT END DETAILS DUE TO CHANGE
            project.current.details.end = {
                ...project.current.details.end,
                rank: value,
                equipment: [...project.current.details.start.equipment],
            };
        }
    }

    function inputFormat(value) {
        return `Rank ${value}`;
    }

    function inputParser(value) {
        const cells = value.toString().split(" ");
        if (!cells[1]) {
            // RETURN A 1 IF NO VALUE (TO PREVENT A CRASH)
            return value !== "" ? value : 1;
        }
        return cells[1].replace(/,*/g, '');
    }

    function RankItems({ unitDetails }) {
        return (
            <Grid
                container
                direction="row"
                alignItems="center"
                justifyContent="center"
                gap={1}>
                <ItemButton {...{index: 0}} />
                <ItemButton {...{index: 1}} />
                <ItemButton {...{index: 2}} />
                <ItemButton {...{index: 3}} />
                <ItemButton {...{index: 4}} />
                <ItemButton {...{index: 5}} />
            </Grid>
        );

        function ItemButton({ index }) {
            const [_forceRender, _setForceRender] = useState(false);
            const rank = unitDetails.rank;
            const avatarID = project.current.details.avatar_id;
            const itemID = data.character.data[avatarID].equipment[`rank_${rank}`]
                ? data.character.data[avatarID].equipment[`rank_${rank}`][index] : "999999";
            const css = "dark-shadow-md rounded-md transition-opacity w-12 h-12 grayscale";
            const imagePath = `${process.env.PUBLIC_URL}/images/items/${itemID}.png`;
            if (itemID === "999999") {
                return (
                    <button className={`${css} opacity-20`}>
                        <img className="cursor-default" src={imagePath} alt="empty item" />
                    </button>
                );
            }
            return (
                <button
                    className={`${css} ${unitDetails.equipment[index] ? "grayscale-0" : "opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]"}`}
                    onClick={() => handleClick(index)}>
                    <img src={imagePath} alt={`rank ${rank} index ${index}`} />
                </button>
            );

            function handleClick(index) {
                unitDetails.equipment[index] = !unitDetails.equipment[index];
                // force render needed here because modifying unit details won't update component.
                _setForceRender(!_forceRender);
            }
        }
    }
}
function IgnoredRarities({ project }) {
    const [ignored, setIgnored] = useState(null);
    return (
        <div>
            <Typography sx={{display: "block"}} variant="button">
                Ignored Rarities (For Project Completion)
            </Typography>
            <Grid container justifyContent="center" direction="row" gap={1}>
                {_CONSTANTS.RARITY.map((rarity) => {
                    const css = "dark-shadow-md rounded-md transition-opacity w-12 h-12 grayscale";
                    const imagePath = `${process.env.PUBLIC_URL}/images/items/99${rarity}999.png`;
                    return (
                        <button
                            key={`ignored-rarities-${rarity}`}
                            className={`${css} ${(project.current.details?.ignored_rarity?.[rarity])
                                ? "grayscale-0"
                                : "opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]"}`}
                            onClick={() => {
                                let obj = project.current.details.ignored_rarity || {};
                                if (obj[rarity]) {
                                    delete project.current.details.ignored_rarity[rarity];
                                    if (Object.keys(project.current.details.ignored_rarity) <= 0) {
                                        delete project.current.details.ignored_rarity;
                                    }
                                }
                                else {
                                    obj[rarity] = true;
                                    project.current.details.ignored_rarity = obj;
                                }
                                setIgnored(JSON.stringify(project.current.details.ignored_rarity));
                            }}>
                            <img src={imagePath} alt={`ignore rarity ${rarity}`} />
                        </button>
                    );
                })}
            </Grid>
        </div>
    );
}

// STEP 2 (ITEM)
function EditItemProjectDetails({ data, userState, userDispatch, closeModal, setStep, project }) {
    const [textFieldError, setTextFieldError] = useState(false);
    const projectName = useRef("");
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
                {[...Object.keys(project.current.required)].map((id) => {
                    return (
                        <ItemButton {...{
                            id,
                            quantity: project.current.required[id],
                        }} key={`project-builder-item-end-project--${id}`} />
                    );
                })}
            </Grid>
            <div className="w-full mb-3">
                <Divider textAlign="left">Additional Details</Divider>
                <div className="space-y-3">
                    <IgnoredRarities {...{ project }} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-1 w-full">
                <Button variant="outlined" color="error" onClick={() => {
                    setStep(1);
                    // RESET DETAILS
                    project.current.details = {
                        ...project.current.details,
                        name: "",
                    };
                }}>
                    Change Items
                </Button>
                <Button variant="contained" color="primary" onClick={() => {
                    if (projectName.current.value === "") {
                        setTextFieldError(true);
                        return;
                    }
                    // PROJECT IS TECHNICALLY DONE
                    project.current.details.name = projectName.current.value;
                    userDispatch({
                        type: "SET_PROJECTS",
                        payload: [...userState.projects, project.current],
                    });
                    console.log([...userState.projects, project.current]);
                    closeModal();
                }}>
                    Create Project
                </Button>
            </div>
        </Grid>
    );
}

const PROJECT_TEMPLATE = Object.freeze({
    character: Object.freeze({
        type: "character",
        date: "0",
        priority: false,
        details: Object.freeze({
            avatar_id: "999999",
            // name: "", (optional)
            formal_name: "",
            start: Object.freeze({
                rank: 1,
                equipment: Object.freeze([false, false, false, false, false, false]),
            }),
            end: Object.freeze({
                rank: 1,
                equipment: Object.freeze([false, false, false, false, false, false]),
            }),
        }),
        required: Object.freeze({}),
    }),
    item: Object.freeze({
        type: "item",
        date: "0",
        priority: false,
        details: Object.freeze({
            name: "",
        }),
        required: Object.freeze({}),
    }),
});
const MODAL_STYLE = Object.freeze({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'rgb(228 228 231)',
    color: 'black',
    boxShadow: 4,
    borderRadius: 1,
    maxHeight: '100%',
    overflow: 'auto',
    p: 4,
});
export { IgnoredRarities };