import React, { useState, useRef } from 'react';
import Button from '@mui/material/Button';

import InputNumber from 'rc-input-number';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import _CONSTANTS from '../scripts/constants';

export default function EditCharacterProject({ data, project, userState, userDispatch, closeModal }) {
    const [startRank, setStartRank] = useState(project.current.details.start.rank);
    const [endRank, setEndRank] = useState(project.current.details.end.rank);
    const [alert, setAlert] = useState("");
    const [_forceRender, _setForceRender] = useState(false);
    const projectName = useRef(null);
    const projectEdit = useRef(JSON.parse(JSON.stringify(project.current)));
    const avatar_id = project.current.details.avatar_id;
    return (
        <Grid
            container
            direction="column"
            alignItems="center" justifyContent="center"
            gap={1}>
            <Grid
                container
                direction="row"
                alignItems="center" justifyContent="center"
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
                defaultValue={project.current.details.name || ""}
                inputRef={projectName} />
            <div className="w-full space-y-3 mb-2">
                <Divider textAlign="left">Start Details</Divider>
                <div className="space-y-3">
                    <InputNumber
                        min={1}
                        max={data.character.max_rank}
                        value={startRank}
                        onChange={(value) => {
                            projectEdit.current.details.start = {
                                ...projectEdit.current.details.start,
                                rank: value,
                                equipment: [false, false, false, false, false, false],
                            };
                            updateStartRank(value);
                        }}
                        formatter={inputFormat}
                        parser={inputParser}
                    />
                    <RankItems {...{unitDetails: projectEdit.current.details.start}} />
                    <Button
                        disabled={!userState.character[avatar_id]}
                        color="warning"
                        onClick={() => {
                            // MAKE A COPY OF THE CHARACTER BECAUSE userState WILL BE MODIFIED OTHERWISE
                            const savedRank = userState.character[avatar_id].rank;
                            projectEdit.current.details.start = {
                                ...projectEdit.current.details.start,
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
                            projectEdit.current.details.end = {
                                ...projectEdit.current.details.end,
                                rank: value,
                                equipment: [false, false, false, false, false, false],
                            };
                            if (startRank === value) {
                                // SINCE START RANK IS THE SAME, END RANK CAN NOT HAVE MISSING START ITEMS
                                projectEdit.current.details.end.equipment = [...projectEdit.current.details.start.equipment];
                            }
                            setEndRank(value);
                        }}
                        formatter={inputFormat}
                        parser={inputParser}
                    />
                    <RankItems {...{unitDetails: projectEdit.current.details.end}} />
                </div>
                <Divider textAlign="left">Additional Details</Divider>
                <div className="space-y-3">
                    <AddMemoryPiece {...{ project: projectEdit }} />
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
                    if (validateProject()) {
                        if (!buildRequiredItems()) {
                            setAlert("Resulting project has no required items.");
                            return;
                        }
                        if (projectName.current.value !== "") {
                            projectEdit.current.details.name = projectName.current.value;
                        }
                        else {
                            delete projectEdit.current.details.name;
                        }

                        // PROJECT IS TECHNICALLY DONE
                        project.current = projectEdit.current;
                        closeModal(true);
                    }
                }}>
                    Edit Project
                </Button>
            </div>
        </Grid>
    );

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
                        defaultValue={project.current.details.memory_piece || 0}
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
                        defaultValue={project.current.details.pure_memory_piece || 0}
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
        const memory_piece = projectEdit.current.details.memory_piece || 0;
        const pure_memory_piece = projectEdit.current.details.pure_memory_piece || 0;
        const start = projectEdit.current.details.start;
        const end = projectEdit.current.details.end;
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
        const start = projectEdit.current.details.start;
        const end = projectEdit.current.details.end;
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
        const memory_piece = projectEdit.current.details.memory_piece || 0;
        const pure_memory_piece = projectEdit.current.details.pure_memory_piece || 0;
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
        projectEdit.current.required = items;

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
            projectEdit.current.details.end = {
                ...projectEdit.current.details.end,
                rank: value,
                equipment: [...projectEdit.current.details.start.equipment],
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