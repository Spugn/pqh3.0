import React, { useState, useEffect, useRef, useCallback } from 'react';
import ItemButton from '../../components/ItemButton';
import InputNumber from 'rc-input-number';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import ItemCatalog from '../../components/ItemCatalog';

export default function Inventory({ data, dataUtils, userState, userDispatch, hidden }) {
    const [isItemListRendered, setIsItemListRendered] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalData, setEditModalData] = useState({
        id: "999999",
        name: "???",
        data: {},
    });
    const [addModalData, setAddModalData] = useState({
        id: "999999",
        name: "",
        data: {},
    });
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [addItemTab, setAddItemTab] = useState(0);
    const userRef = useRef(null); // used to save a reference to userState for openAddItem() to use

    useEffect(() => {
        // need to do this cus openAddItem saves the current userState to use when init, which we don't want
        userRef.current = userState;
    });

    const openEditModal = useCallback((id) => {
        let base_id, name;
        if (data.equipment.data[id]) {
            // ITEM IS A FULL ITEM OR MEMORY PIECE
            base_id = id;
            name = data.equipment.data[id].name;
        }
        else {
            // ITEM IS A FRAGMENT
            base_id = dataUtils.equipment.fragment.to_base(id);
            name = data.equipment.data[base_id].fragment.name;
        }
        setEditModalData({
            id: base_id,
            name,
            data: {
                id,
                quantity: userState.inventory[id] ? userState.inventory[id] : 0,
            },
        });
        setEditModalOpen(true);
    }, [data.equipment.data, userState.inventory, dataUtils.equipment.fragment]);

    function closeEditModal(save) {
        setEditModalOpen(false);
        if (save) {
            if (editModalData.data.quantity <= 0) {
                // DELETE FROM INVENTORY IF LESS THAN OR EQUAL TO 0
                delete userState.inventory[editModalData.data.id];
            } else {
                userState.inventory[editModalData.data.id] = editModalData.data.quantity;
            }
            userDispatch({
                type: 'SET_INVENTORY',
                payload: userState.inventory,
            });
        }
    }

    function openAddModal() {
        setIsItemListRendered(true);
        setAddModalOpen(true);
        closeAddItem(false);
    }

    function closeAddModal() {
        setAddModalOpen(false);
    }

    function openAddItem(id) {
        setAddItemOpen(true);

        // POSITION TABS TO BE AT VALID OPTION
        const tabValue = (!dataUtils.equipment.fragment.exists(id) && dataUtils.equipment.exists(id)) ? 1 : 0;
        const tabID = tabValue === 0 ? data.equipment.data[id].fragment.id : id;
        setAddItemTab(tabValue);
        setAddModalData({
            id,
            name: tabValue === 0 ? data.equipment.data[id].fragment.name : data.equipment.data[id].name,
            equip_data: data.equipment.data[id],
            data: {
                id: tabID,
                quantity: userRef.current.inventory[tabID] ? userRef.current.inventory[tabID] : 0,
            },
        });
    }

    function closeAddItem(save) {
        setAddItemOpen(false);
        if (save) {
            if (addModalData.data.quantity > 0) {
                // ADD DATA TO userState IF GREATER THAN 0
                const id = addModalData.data.id;
                userState.inventory[id] = addModalData.data.quantity;
                userDispatch({
                    type: 'SET_INVENTORY',
                    payload: userState.inventory,
                });
            }
        }
    }

    function AddItemTabs() {
        function FullItemImage() {
            let id = addModalData.id;
            if (!data.equipment.data[id]) {
                id = "999999";
            }
            return (
                <img className="w-8 h-8"
                    src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
                    alt={`full item id ${id}`} />
            );
        }
        function FragmentImage() {
            let id = addModalData.id;
            if (!data.equipment.data[id]) {
                id = "999999";
            }
            else {
                id = data.equipment.data[id].fragment.id;
            }
            return (
                <img className="w-8 h-8"
                    src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
                    alt={`fragment item id ${id}`} />
            );
        }
        function handleChange(event, newValue) {
            setAddItemTab(newValue);
            const tabID = newValue === 0 ? addModalData.equip_data.fragment.id : addModalData.id;
            setAddModalData({
                ...addModalData,
                name: newValue === 0 ? data.equipment.data[addModalData.id].fragment.name
                    : data.equipment.data[addModalData.id].name,
                data: {
                    ...addModalData.data,
                    id: tabID,
                    quantity: userState.inventory[tabID] ? userState.inventory[tabID] : 0,
                },
            });
        }
        return (
            <Tabs value={addItemTab}
                onChange={handleChange}
                className="mb-3"
                aria-label="add item tabs">
                <Tab iconPosition="bottom"
                    icon={<FragmentImage />}
                    label="Fragment"
                    disabled={!dataUtils.equipment.fragment.exists(addModalData.id)} />
                <Tab iconPosition="bottom"
                    icon={<FullItemImage />}
                    label="Full Item"
                    disabled={!dataUtils.equipment.exists(addModalData.id)} />
            </Tabs>
        );
    }

    function handleDeleteItem() {
        delete userState.inventory[editModalData.data.id];
        userDispatch({
            type: 'SET_INVENTORY',
            payload: userState.inventory,
        });
        closeEditModal(false); // DON'T SAVE, WE'VE ALREADY MADE CHANGES
    }

    function editModalOnInputChange(value) {
        setEditModalData({
            ...editModalData,
            data: {
                ...editModalData.data,
                quantity: value,
            },
        });
    }

    function addItemOnInputChange(value) {
        setAddModalData({
            ...addModalData,
            data: {
                ...addModalData.data,
                quantity: value,
            },
        });
    }

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        color: 'black',
        boxShadow: 4,
        borderRadius: 1,
        maxHeight: '100%',
        overflow: 'auto',
        p: 4,
    };
    return (
        <div hidden={hidden}>
            <div className={"grid grid-cols-1"}>
                <Button variant="contained" className="m-3"
                onClick={() => openAddModal()}
                endIcon={<img className="h-8" src={`${process.env.PUBLIC_URL}/images/webpage/Inventory_Crate.png`} alt={'add item'} />}>
                    Add Item
                </Button>
                {// ONLY RENDER IF Inventory CATEGORY IS OPEN
                !hidden && <InventoryList {...{userState, callback: openEditModal}} />}
            </div>
            <Modal
                open={editModalOpen}
                onClose={() => closeEditModal(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
            }}>
                <Fade in={editModalOpen}>
                    <Box sx={modalStyle} className="standard-font text-center">
                        <div>
                            <div className="font-extrabold text-2xl">{editModalData.name}</div>
                            <div className="text-black/[0.5] font-bold text-xl mb-3">({editModalData.id})</div>
                            <img className="inline w-16 h-16" src={`${process.env.PUBLIC_URL}/images/items/${editModalData.data.id}.png`} alt={`item ${editModalData.data.id}`} />
                        </div>
                        <div className="mt-4">
                            <span className="relative bottom-1 mr-0.5">Inventory</span>
                            <img className="inline w-8 h-8 mx-1 relative bottom-1" src={`${process.env.PUBLIC_URL}/images/webpage/Inventory_Crate.png`} alt={'inventory crate'} />
                            <InputNumber className="inline-block"
                                autoFocus max={9999} min={0}
                                defaultValue={editModalData.data.quantity}
                                formatter={inputFormat}
                                parser={inputParser}
                                onChange={editModalOnInputChange} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-1">
                            <Button variant="outlined" color="error" onClick={() => closeEditModal(false)}>Cancel</Button>
                            <Button variant="contained" onClick={() => closeEditModal(true)}>Save</Button>
                        </div>
                        <div className="mt-3 grid grid-cols-1">
                            <Button variant="contained" color="error" onClick={() => handleDeleteItem()}>Delete</Button>
                        </div>
                    </Box>
                </Fade>
            </Modal>
            <Modal
                open={addModalOpen}
                onClose={() => closeAddModal()}
                closeAfterTransition
                keepMounted
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
            }}>
                <Fade in={addModalOpen}>
                    <Box sx={modalStyle} className="w-[75vw] standard-font text-center">
                        <Stepper activeStep={addItemOpen ? 1 : 0} className="mb-4">
                            <Step>
                                <StepLabel>Select Item</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Select Amount</StepLabel>
                            </Step>
                        </Stepper>
                        <Stack className="overflow-y-scroll max-h-[75vh]" hidden={addItemOpen}>
                            {// ONLY RENDER WHEN NEEDED; EXPENSIVE COMPUTATION
                            /*isItemListRendered && <ItemList {...{data, callback: openAddItem}} />*/}
                            {isItemListRendered && <ItemCatalog {...{data, callback: openAddItem, keyPrefix: "inventory", hidden: (hidden || addItemOpen) }} />}
                        </Stack>
                        {addItemOpen && <Box>
                            <AddItemTabs />
                            <div>
                                <div className="font-extrabold text-2xl">{addModalData.name}</div>
                                <div className="text-black/[0.5] font-bold text-xl mb-3">({addModalData.data.id})</div>
                                <img className="inline w-16 h-16" src={`${process.env.PUBLIC_URL}/images/items/${addModalData.data.id}.png`} alt={`item ${addModalData.data.id}`} />
                            </div>
                            <div className="mt-6">
                                <span className="relative bottom-1 mr-0.5">Inventory</span>
                                <img className="inline w-8 h-8 mx-1 relative bottom-1" src={`${process.env.PUBLIC_URL}/images/webpage/Inventory_Crate.png`} alt={'inventory crate'} />
                                <InputNumber
                                    className="inline-block"
                                    autoFocus max={9999} min={0}
                                    value={addModalData.data.quantity}
                                    formatter={inputFormat}
                                    parser={inputParser}
                                    onChange={addItemOnInputChange} />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-1">
                                <Button variant="outlined" color="error" onClick={() => closeAddItem(false)}>Cancel</Button>
                                <Button variant="contained" onClick={() => closeAddItem(true)}>Save</Button>
                            </div>
                        </Box>}
                    </Box>
                </Fade>
            </Modal>
        </div>
    );

    function inputFormat(value) {
        return `× ${value}`;
    }

    function inputParser(value) {
        const cells = value.toString().split(" ");
        if (!cells[1]) {
            // RETURN A 1 IF NO VALUE (TO PREVENT A CRASH)
            return value !== "" ? value : 0;
        }
        return cells[1].replace(/,*/g, '');
    }
}

function InventoryList({userState, callback}) {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    useEffect(() => {
        // USING setTimeout HERE SO WE CAN DISPLAY A SPINNER WHILE OUR DATA LOADS.
        setTimeout(() => {
            let t_items = [];
            Object.entries(userState.inventory).forEach(([id, quantity]) => {
                const entry = <ItemButton {...{
                    id,
                    quantity,
                    callback: () => callback(id),
                }} key={`inventory-list--${id}`} />;
                t_items.push(entry);
            });
            t_items.sort((a, b) => {
                if (a.props.quantity > b.props.quantity) return -1; // quantity sort, descending
                if (a.props.quantity < b.props.quantity) return 1;
                if (a.props.id > b.props.id) return -1; // id sort, descending (fragments > full items > memory pieces) (high rarity > low rarity)
                if (a.props.id < b.props.id) return 1;
                return 0;
            });
            setItems(t_items);
            setLoading(false);
        });
    }, [userState, callback]);

    return (
        <div className="text-center space-x-0.5">
            {loading && <CircularProgress disableShrink color="secondary" />}
            {(!loading && items.length <= 0) &&
                <Alert severity="warning" className="mx-3 text-left">
                    <AlertTitle className="italic">Your inventory is empty...</AlertTitle>
                    Add items to your inventory by clicking the "<strong>Add Item</strong>" button above!
                </Alert>}
            {(!loading && items.length > 0) &&
                <Alert severity="info" className="mx-3 mb-3 text-left">
                    Click on an item to edit the amount you own.
                </Alert>}
            {items}
        </div>
    );
}