import React, { useState, useEffect, useCallback } from 'react';
import CharacterButton from '../../components/CharacterButton';
import InputNumber from 'rc-input-number';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import { MODAL_STYLE } from '../../scripts/constants';

export default function Characters({ data, userState, userDispatch, hidden }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState({
        id: "999999",
        name: "???",
        data: {},
    });

    const openModal = useCallback((id) => {
        setModalOpen(true);
        setModalData({
            id: id,
            name: data.character.data[id].name,
            data: userState.character[id]
                ? JSON.parse(JSON.stringify(userState.character[id])) // copy so we don't modify the original
                : {
                    equipment: [false, false, false, false, false, false],
                    rank: 1,
                    id,
                },
        });
    }, [data.character.data, userState.character]);

    function closeModal(save) {
        setModalOpen(false);
        if (save) {
            userState.character[modalData.id] = modalData.data;
            userDispatch({
                type: 'SET_CHARACTER',
                payload: userState.character,
            });
        }
    }

    function handleDeleteData() {
        delete userState.character[modalData.id];
        userDispatch({
            type: 'SET_CHARACTER',
            payload: userState.character,
        });
        closeModal(false); // DON'T SAVE, WE'VE ALREADY MADE CHANGES
    }

    function handleInputChange(value) {
        setModalData({
            ...modalData,
            data: {
                ...modalData.data,
                rank: value,
                equipment: [false, false, false, false, false, false],
            },
        });
    }

    function ItemImage({ index, classes }) {
        const equips = data.character.data[modalData.id].equipment;
        const imageName = equips[`rank_${modalData.data.rank}`] ? equips[`rank_${modalData.data.rank}`][index] : "999999";
        const imagePath = `${process.env.PUBLIC_URL}/images/items/${imageName}.png`;
        const css = "inline-block dark-shadow-md rounded-md transition-opacity w-12 h-12 sm:w-16 sm:h-16 grayscale";
        if (imageName === "999999") {
            return (
                <button className={`${css}${classes ? ` ${classes}` : ''} opacity-20`}>
                    <img className="cursor-default" src={imagePath} alt="empty item" />
                </button>
            );
        }
        return (
            <button className={`${css} ${modalData.data.equipment[index] ? 'grayscale-0' : 'opacity-[50%] hover:opacity-[75%] hover:grayscale-[50%]'} ${classes ? ` ${classes}` : ''}`}
                onClick={() => handleItemClick(index)}>
                <img src={imagePath} alt={`character equip index ${index}`} />
            </button>
        );

        function handleItemClick(index) {
            let equips = modalData.data.equipment;
            equips[index] = !equips[index];
            setModalData({
                ...modalData,
                data: {
                    ...modalData.data,
                    equipment: equips,
                },
            });
        }
    }

    return (
        <>
            {!hidden &&
                <div className="text-center m-3">
                    <CharacterList {...{data, userState, callback: openModal}} />
                </div>
            }
            <Modal
                open={modalOpen}
                onClose={() => closeModal(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}>
                <Fade in={modalOpen}>
                    <Box sx={MODAL_STYLE} className="standard-font text-center">
                        <div className="font-extrabold text-md sm:text-2xl">{modalData.name}</div>
                        <div className="text-black/[0.5] font-bold sm:text-xl mb-3">({modalData.id})</div>
                        <div className="grid grid-cols-3">
                            <div className="place-self-end mr-2">
                                <ItemImage {...{index: 0}} /><br />
                                <ItemImage {...{index: 2, classes: 'my-2 relative right-3'}} /><br />
                                <ItemImage {...{index: 4}} />
                            </div>
                            <div className="place-self-center max-w-lg">
                                <img className="w-15 h-15 sm:w-min sm:h-min rounded-xl dark-shadow-md"
                                    src={`${process.env.PUBLIC_URL}/images/unit_icon/${modalData.id}.png`}
                                    alt={`character ${modalData.id}`} />
                            </div>
                            <div className="place-self-start ml-2">
                                <ItemImage {...{index: 1}} /><br />
                                <ItemImage {...{index: 3, classes: 'my-2 relative left-3'}} /><br />
                                <ItemImage {...{index: 5}} />
                            </div>
                        </div>
                        <div className="mt-2">
                            <InputNumber className="inline-block"
                                autoFocus max={data.character.max_rank} min={1}
                                formatter={inputFormat}
                                parser={inputParser}
                                defaultValue={modalData.data.rank} onChange={handleInputChange} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-1">
                            <Button variant="outlined" color="error" onClick={() => closeModal(false)}>Cancel</Button>
                            <Button variant="contained" onClick={() => closeModal(true)}>Save</Button>
                        </div>
                        <div className="mt-3 grid grid-cols-1">
                            <Button variant="contained" color="error" onClick={() => handleDeleteData()}>Delete</Button>
                        </div>
                    </Box>
                </Fade>
            </Modal>
        </>
    );

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
};

function CharacterList({data, userState, callback}) {
    const [loading, setLoading] = useState(true);
    const [characters, setCharacters] = useState([]);
    useEffect(() => {
        // USING setTimeout HERE SO WE CAN DISPLAY A SPINNER WHILE OUR DATA LOADS.
        setTimeout(() => {
            let t_characters = [];
            Object.entries(data.character.data).forEach(([id, value]) => {
                //console.log(id, value);
                const rank = userState.character[id] ? userState.character[id].rank : 0;
                t_characters.push(
                    <CharacterButton {...{id, rank, callback: () => callback(id)}} key={`characters--${id}`} />
                );
            });
            t_characters.sort((a, b) => {
                if (a.props.rank > b.props.rank) return -1; // rank sort, descending
                if (a.props.rank < b.props.rank) return 1;
                return 0;
            });
            setCharacters(t_characters);
            setLoading(false);
        });
    }, [data.character.data, userState, callback]);

    return (
        <div className="text-center space-x-0.5">
            {loading && <CircularProgress disableShrink color="secondary" />}
            {!loading &&
                <Alert severity="info" className="mx-3 mb-3 text-left">
                    Click on a character to edit their equips and rank.
                </Alert>}
            {characters}
        </div>
    );
}