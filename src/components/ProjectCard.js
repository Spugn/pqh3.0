import React, { useState, useEffect, useRef } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Fade from '@mui/material/Fade';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { yellow, green, red } from '@mui/material/colors';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';
import Modal from '@mui/material/Modal';
import EditCharacterProject from './EditCharacterProject';
import EditItemProject from './EditItemProject';
import ItemButton from './ItemButton';
import data_utils from '../scripts/data_utils';
import { MODAL_STYLE } from '../scripts/constants';

/**
 * MANAGES PROJECT CARDS AND THEIR DESIGN.
 * PROJECT CARDS CONTAIN A VISUALLY APPEALING DISPLAY OF THE PROJECT DATA. USERS CAN ENABLE/DISABLE PROJECTS, EDIT
 * PROJECTS, PRIORITIZE PROJECTS (BOOST IN QUEST SCORE FOR ITEMS IN THE PROJECT), COMPLETE PROJECTS (SAVE CHARACTER,
 * CONSUME INVENTORY, AND REMOVE THE PROJECT), AND DELETE PROJECTS THROUGH THE PROJECT CARD.
 * PROJECT CARDS ALSO HAVE AN INDICATOR FOR IF THE PROJECT IS COMPLETED OR PRIORITIZED.
 *
 * @param {Object} param0                         OBJECT CONTAINING THE FOLLOWING PROPERTIES
 * @param {Object} param0.data                    OBJECT CONTAINING EQUIPMENT/CHARACTER/QUEST DATA
 * @param {boolean} param0.defaultEnabled         BOOLEAN FOR IF THE PROJECT CARD SHOULD BE MARKED AS ENABLED
 *                                                BY DEFAULT. THIS IS NECESSARY BECAUSE CARDS ARE REMADE WHEN
 *                                                INVENTORY IS UPDATED.
 * @param {Function} param0.projectMapDispatch    FUNCTION TO UPDATE THE PROJECT MAP
 * @param {Object} param0.userState               OBJECT CONTAINING USER'S PROJECTS/INVENTORY/ETC
 * @param {Function} param0.userDispatch          FUNCTION TO UPDATE THE USER'S PROJECTS/INVENTORY/ETC
 * @returns PROJECT CARD JSX COMPONENT
 */
export default function ProjectCard({ data, project, defaultEnabled, projectMapDispatch, userState,
    userDispatch }) {
    const [loading, setLoading] = useState(true);
    const [expand, setExpand] = useState(false); // expanded project details
    const [anchorEl, setAnchorEl] = useState(null); // used for triple dot menu
    const cardRef = useRef(null); // contains avatar, title, subheader for project card
    const [modalOpen, setModalOpen] = useState(false); // open modal for editing project
    const editProject = useRef({}); // ref to EditCharacterProject component

    // for required and missing
    const [requiredItems, setRequiredItems] = useState([]);
    const [missingItems, setMissingItems] = useState([]);
    const requiredEntries = useRef(0);
    const missingEntries = useRef(0);
    const requiredCount = useRef(0);
    const missingCount = useRef(0);

    // project status
    const [enabled, setEnabled] = useState(defaultEnabled);
    const [prioritized, setPrioritized] = useState(project.priority);
    const [completed, setCompleted] = useState(false);

    // misc details
    const menuOpen = Boolean(anchorEl); // used for triple dot menu
    const transparent = !(enabled || expand); // used for background color

    useEffect(() => {
        // do this only once
        cardRef.current = buildCardRef(project);
        setLoading(false);
    }, [project]);

    useEffect(() => {
        // this will be updated via key change if inventory changed
        const invCheck = data_utils(data).project.check(project, userState.inventory,
            userState.settings.use_legacy ? 0 : undefined,
            project.details.ignored_rarity || {});
        setCompleted(invCheck[0]);
        updateRequiredAndMissing({ project, invCheck });
    }, [project, userState.settings.use_legacy, userState.inventory, data]);

    // hide/show project details
    function handleExpand() {
        setExpand(!expand);
    }

    // expand/close triple dot menu
    function handleMenuClick(event) {
        setAnchorEl(event.currentTarget);
    }

    function handleMenuClose() {
        setAnchorEl(null);
    }

    // onClick on the Enabled button
    function toggleEnabled() {
        projectMapDispatch({
            type: "SET_ENABLE_PROJECT",
            payload: {
                enabled: !enabled,
                project,
            },
        });
        setEnabled(!enabled);
    }

    // onClick on the Prioritize button
    function togglePrioritized() {
        userDispatch({
            type: 'REPLACE_PROJECT',
            payload: {
                ...project,
                priority: !prioritized,
            },
        });
        setPrioritized(!prioritized);
    }

    // open edit modal here
    function openEditModal() {
        editProject.current = JSON.parse(JSON.stringify(project)); // copy project
        setModalOpen(true);
    }

    /**
     * UPDATE REQUIRED AND MISSING ITEMS. THIS ALSO CREATES THE ITEM BUTTONS FOR THE REQUIRED ITEMS AND MISSING ITEMS
     * DISPLAY IN THE PROJECT CARD.
     *
     * @param {Object} param0            OBJECT CONTAINING THE FOLLOWING PROPERTIES
     * @param {Object} param0.project    OBJECT CONTAINING THE PROJECT DATA
     * @param {Array} param0.invCheck    ARRAY CONTAINING INVENTORY CHECK RESULTS [missingAnything?, requiredItems]
     */
    function updateRequiredAndMissing({ project, invCheck }) {
        requiredEntries.current = Object.keys(project.required).length;
        missingEntries.current = Object.keys(invCheck[1]).length;
        requiredCount.current = 0;
        missingCount.current = 0;
        setRequiredItems(
            [...Object.keys(project.required)].map((id, index) => {
                requiredCount.current += project.required[id];
                return (
                    <ItemButton {...{
                        id,
                        quantity: project.required[id],
                    }} key={`project-details--required-${index}-${id}`} />
                );
            }).sort((a, b) => b.props.quantity - a.props.quantity) // SORT BY QUANTITY, DESCENDING
        );
        if (missingEntries.current <= 0) {
            // no missing items, don't do setMissingItems update
            return;
        }
        setMissingItems(
            [...Object.keys(invCheck[1])].map((id, index) => {
                missingCount.current += invCheck[1][id];
                return (
                    <ItemButton {...{
                        id,
                        quantity: invCheck[1][id],
                        }} key={`project-details--required-${index}-${id}`} />
                );
            }).sort((a, b) => b.props.quantity - a.props.quantity) // SORT BY QUANTITY, DESCENDING
        );
    }

    if (loading) {
        return (<></>);
    }
    return (
        <>
            <Card sx={{minHeight: 155, width: !expand ? "400px" : "100%", opacity: transparent ? "0.8" : "1", }}>
                <ProjectCardHeader {...{ cardRef, handleMenuClick }}/>
                <ProjectCardActions {...{ enabled, toggleEnabled, prioritized, completed, expand, handleExpand }} />
                <ProjectCardContent {...{ data, project, expand, requiredEntries, requiredCount, requiredItems,
                    missingEntries, missingCount, missingItems }} />
                <ProjectMenu {...{ anchorEl, menuOpen, handleMenuClose, openEditModal, togglePrioritized, userDispatch,
                    completed, project, data, cardRef }} />
            </Card>
            <ProjectEditModal {...{ data, editProject, cardRef, userState, userDispatch, modalOpen, setModalOpen }} />
        </>
    );
}

/**
 * MANAGES THE HEADER OF THE PROJECT CARD. INCLUDES THE AVATAR, TITLE, SUBHEADER, AND MENU BUTTON.
 *
 * @param {Object} param0                      OBJECT CONTAINING THE FOLLOWING PROPERTIES
 * @param {Object} param0.cardRef              REF CONTAINING DETAILS FOR PROJECT CARD COMPONENTS (AVATAR, TITLE,
 *                                             SUBHEADER)
 * @param {Function} param0.handleMenuClick    FUNCTION TO HANDLE EXPAND/CLOSE OF THE PROJECT CARD MENU
 * @returns CARD HEADER JSX COMPONENT
 */
function ProjectCardHeader({ cardRef, handleMenuClick }) {
    return (
        <CardHeader
            avatar={cardRef.current.avatar}
            action={<IconButton onClick={handleMenuClick}><MoreVertIcon /></IconButton>}
            title={cardRef.current.title}
            subheader={cardRef.current.subheader}
            sx={{ // HIDE LONG TITLE OVERFLOW
                display: "flex",
                overflow: "hidden",
                "& .MuiCardHeader-content": {
                    overflow: "hidden"
                }
            }}
        />
    );
}

/**
 * MANAGES THE PROJECT CARD ACTIONS. INCLUDES THE ENABLE/DISABLE BUTTON, PRIORITIZE CHIP, COMPLETE CHIP,
 * AND EXPAND/CLOSE BUTTON.
 *
 * @param {Object} param0                     OBJECT CONTAINING THE FOLLOWING PROPERTIES
 * @param {Boolean} param0.enabled            BOOLEAN TO DETERMINE IF PROJECT IS ENABLED
 * @param {Function} param0.toggleEnabled     FUNCTION TO TOGGLE ENABLE/DISABLE OF PROJECT
 * @param {Boolean} param0.prioritized        BOOLEAN TO DETERMINE IF PROJECT IS PRIORITIZED
 * @param {Boolean} param0.completed          BOOLEAN TO DETERMINE IF PROJECT IS COMPLETED
 * @param {Boolean} param0.expand             BOOLEAN TO DETERMINE IF PROJECT CARD IS EXPANDED
 * @param {Function} param0.handleExpand      FUNCTION TO HANDLE EXPAND/CLOSE OF THE PROJECT CARD
 * @returns PROJECT CARD ACTIONS JSX COMPONENT
 */
function ProjectCardActions({ enabled, toggleEnabled, prioritized, completed, expand, handleExpand }) {
    // used for the expand/collapse button arrow
    const ExpandMore = styled((props) => {
        const { expand, ...other } = props;
        return <IconButton {...other} />;
    })(({ theme, expand }) => ({
        transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
        marginLeft: 'auto',
        transition: theme.transitions.create('transform', {
          duration: theme.transitions.duration.shortest,
        }),
    }));

    return (
        <CardActions disableSpacing>
            <Stack direction="row" spacing={1}>
                <Button
                    variant="outlined"
                    color={enabled ? "success" : "error"}
                    onClick={toggleEnabled}
                    startIcon={enabled ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                >
                    {enabled ? "Enabled" : "Disabled"}
                </Button>
                {prioritized && <Chip icon={<StarIcon />} label="Priority" color="warning" size="small"
                    variant="outlined" />}
                {completed && <Chip icon={<CheckIcon />} label="Complete" color="success" size="small"
                    variant="outlined" />}
            </Stack>
            <ExpandMore expand={expand} onClick={() => handleExpand()}>
                <Tooltip title="More details" placement="top" arrow>
                    <ExpandMoreIcon />
                </Tooltip>
            </ExpandMore>
        </CardActions>
    );
}

/**
 * MANAGES THE PROJECT CARD CONTENT.
 * PROJECT CARD CONTENT IS USUALLY THE REQUIRED ITEMS, MISSING ITEMS, AND FILTERED RARITIES, BUT CHARACTER PROJECTS
 * ALSO INCLUDE DETAILS ABOUT THE START AND END RANK.
 *
 * @param {Object} param0                    OBJECT CONTAINING THE FOLLOWING PROPERTIES
 * @param {Object} param0.data               OBJECT CONTAINING EQUIPMENT/CHARACTER/QUEST DATA
 * @param {Object} param0.project            OBJECT CONTAINING PROJECT DETAILS
 * @param {boolean} param0.expand            BOOLEAN TO DETERMINE IF PROJECT CARD IS EXPANDED
 * @param {number} param0.requiredEntries    NUMBER OF REQUIRED ENTRIES
 * @param {number} param0.requiredCount      NUMBER OF REQUIRED INDIVIDUAL ITEMS
 * @param {Array} param0.requiredItems       ARRAY OF REQUIRED ITEM JSX COMPONENTS
 * @param {number} param0.missingEntries     NUMBER OF MISSING ENTRIES
 * @param {number} param0.missingCount       NUMBER OF MISSING INDIVIDUAL ITEMS
 * @param {Array} param0.missingItems        ARRAY OF MISSING ITEM JSX COMPONENTS
 * @returns PROJECT CARD CONTENT JSX COMPONENT
 */
function ProjectCardContent({ data, project, expand, requiredEntries, requiredCount, requiredItems, missingEntries,
        missingCount, missingItems }) {
    return (
        <Collapse in={expand} timeout="auto" unmountOnExit>
            <CardContent>
                {project.type === "character" && <CharacterCardDetails />}
                {/* NEED THE REQUIRED/MISSING CODE BLOCK HERE CUS IT'LL KEEP RE-RENDERING OTHERWISE */}
                {project.details.ignored_rarity && <div className="w-full">
                    <Divider textAlign="left" className="mb-3">
                        <strong>Ignored Rarities</strong> (for project completion)
                    </Divider>
                    <Grid container direction="row" justifyContent="center" gap={1}>
                        {Object.keys(project.details.ignored_rarity).map((rarity) => {
                            return (
                                <ItemButton {...{
                                    id: `99${rarity}999`,
                                    quantity: 0,
                                    ignore_quantity: true,
                                    }} key={`project-details--ignored-${rarity}`} />
                            );
                        })}
                    </Grid>
                </div>}
                <div className="w-full">
                    <Divider textAlign="left" className="mb-3">
                        <strong>Required Items </strong>
                        ({requiredEntries.current} entries, {requiredCount.current} items)
                    </Divider>
                    <Grid container direction="row" alignItems="center" justifyContent="center" gap={0.3}>
                        {requiredItems}
                    </Grid>
                </div>
                {missingEntries.current > 0 && // only render missing items if there are any
                    <div className="w-full">
                        <Divider textAlign="left" className="mb-3">
                            <strong>Missing Items </strong>
                            ({missingEntries.current} entries, {missingCount.current} items)
                        </Divider>
                        <Grid container direction="row" alignItems="center" justifyContent="center" gap={0.3}>
                            {missingItems}
                        </Grid>
                    </div>
                }
            </CardContent>
        </Collapse>
    );

    /**
     * ADDITIONAL PROJECT DETAILS SPECIFIC TO CHARACTER PROJECTS.
     * @returns CHARACTER CARD DETAILS JSX COMPONENT
     */
    function CharacterCardDetails() {
        return (
            <>
                <div className="w-full">
                    <Divider textAlign="left" className="mb-3">
                        <strong>Rank {project.details.start.rank}</strong> (start)
                    </Divider>
                    <Grid container direction="row" alignItems="center" justifyContent="center" gap={0.5}>
                        {data.character.data[project.details.avatar_id].equipment[`rank_${project.details.start.rank}`]
                        ? data.character.data[project.details.avatar_id]
                            .equipment[`rank_${project.details.start.rank}`].map((id, index) => {
                            return (
                                <img src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
                                    className={`h-12 w-12 ${project.details.start.equipment[index] ? ""
                                        : "grayscale opacity-50"}`}
                                    alt={`item ${id}`}
                                    key={`project-details--${project.details.start.rank}-${index}-${id}`} />
                            );
                        })
                        :
                        // start rank does not exist, load placeholder images
                        data.character.data[project.details.avatar_id].equipment[`rank_1`].map((id, index) => {
                            return (
                                <img src={`${process.env.PUBLIC_URL}/images/items/999999.png`}
                                    className={`h-12 w-12 grayscale opacity-50`}
                                    alt={`item 999999`}
                                    key={`project-details--${project.details.start.rank}-${index}-999999`} />
                            );
                        })
                        }
                    </Grid>
                </div>
                <div className="w-full">
                    <Divider textAlign="left" className="mb-3">
                        <strong>Rank {project.details.end.rank}</strong> (end)
                    </Divider>
                    <Grid container direction="row" alignItems="center" justifyContent="center" gap={0.5}>
                        {data.character.data[project.details.avatar_id].equipment[`rank_${project.details.end.rank}`]
                        ? data.character.data[project.details.avatar_id]
                            .equipment[`rank_${project.details.end.rank}`].map((id, index) => {
                            return (
                                <img src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
                                    className={`h-12 w-12 ${project.details.end.equipment[index] ? ""
                                        : "grayscale opacity-50"}`}
                                    alt={`item ${id}`}
                                    key={`project-details--${project.details.end.rank}-${index}-${id}`} />
                            );
                        })
                        :
                        // start rank does not exist, load placeholder images
                        data.character.data[project.details.avatar_id].equipment[`rank_1`].map((id, index) => {
                            return (
                                <img src={`${process.env.PUBLIC_URL}/images/items/999999.png`}
                                    className={`h-12 w-12 grayscale opacity-50`}
                                    alt={`item 999999`}
                                    key={`project-details--${project.details.end.rank}-${index}-999999`} />
                            );
                        })
                        }
                    </Grid>
                </div>
            </>
        );
    }
}

/**
 * HANDLES THE PROJECT MENU.
 * THE PROJECT MENU CONTAINS AN EDIT, COMPLETE, PRIORITIZE, AND DELETE BUTTON.
 * CLICKING ON THE EDIT, COMPLETE, OR DELETE BUTTONS WILL OPEN A MODAL FOR THE USER TO DO CERTAIN ACTIONS.
 *
 * @param {Object} param0                        OBJECT CONTAINING THE FOLLOWING PROPERTIES
 * @param {Object} param0.anchorEl               ANCHOR ELEMENT THAT MENU SHOULD ATTACH TO
 * @param {boolean} param0.menuOpen              BOOLEAN TO DETERMINE IF MENU IS OPEN
 * @param {Function} param0.handleMenuClose      FUNCTION TO HANDLE CLOSING THE MENU
 * @param {Function} param0.openEditModal        FUNCTION TO OPEN EDIT MODAL
 * @param {Function} param0.togglePrioritized    FUNCTION TO TOGGLE PRIORITIZED STATUS
 * @param {Function} param0.userDispatch         FUNCTION TO MODIFY USER STATE
 * @param {boolean} param0.complete              USED TO DETERMINE IF THE COMPLETE MENU BUTTON SHOULD BE ENABLED
 * @param {Object} param0.project                PROJECT OBJECT CONTAINING DETAILS ABOUT A PROJECT
 * @param {Object} param0.data                   OBJECT CONTAINING CHARACTER/EQUIPMENT/QUEST DATA
 * @param {Object} param0.cardRef                REF CONTAINING DETAILS ABOUT A PROJECT CARD (AVATAR, TITLE, SUBHEADER)
 * @returns PROJECT MENU JSX COMPONENT
 */
function ProjectMenu({ anchorEl, menuOpen, handleMenuClose, openEditModal, togglePrioritized, userDispatch,
    completed, project, data, cardRef }) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const completeSettings = useRef({
        save: true,     // save the character end result to collection
        consume: true,  // consome project items from inventory
    });
    return (
        <>
            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    handleMenuClose();
                    openEditModal();
                }}>
                    <ListItemIcon><EditIcon /></ListItemIcon>
                    <ListItemText primary="Edit" />
                </MenuItem>
                <MenuItem onClick={() => {
                    handleMenuClose();
                    togglePrioritized();
                }}>
                    <ListItemIcon><StarIcon sx={{color: yellow[800]}} /></ListItemIcon>
                    <ListItemText primary="Prioritize" />
                </MenuItem>
                <MenuItem disabled={!completed} onClick={() => {
                    completeSettings.current = {
                        save: true,
                        consume: true,
                    };
                    handleMenuClose();
                    setCompleteModalOpen(true);
                }}>
                    <ListItemIcon><CheckIcon sx={{color: green[700]}} /></ListItemIcon>
                    <ListItemText primary="Complete" />
                </MenuItem>
                <MenuItem onClick={() => {
                    handleMenuClose();
                    setDeleteModalOpen(true);
                }}>
                    <ListItemIcon><DeleteIcon sx={{color: red[500]}} /></ListItemIcon>
                    <ListItemText primary="Delete" />
                </MenuItem>
            </Menu>
            <ProjectCompleteModal {...{ completeModalOpen, setCompleteModalOpen, cardRef, project, data,
                completeSettings, userDispatch }} />
            <ProjectDeleteModal {...{ deleteModalOpen, setDeleteModalOpen, cardRef, project, userDispatch }} />
        </>
    );
}

/**
 * MANAGES THE PROJECT COMPLETE MODAL.
 * THE PROJECT COMPLETE MODAL HAS OPTIONS FOR THE USER TO SELECT BEFORE THEY COMPLETE A PROJECT. THE USER WILL
 * HAVE THE OPTION TO SAVE THE CHARACTER'S END RESULT TO THEIR COLLECTION AND CHOOSE IF THEY WANT TO CONSUME
 * REQUIRED ITEMS FROM THEIR INVENTORY.
 *
 * @param {Object} param0                           OBJECT CONTAINING THE FOLLOWING PROPERTIES
 * @param {boolean} param0.completeModalOpen        BOOLEAN TO DETERMINE IF COMPLETE MODAL IS OPEN
 * @param {Function} param0.setCompleteModalOpen    FUNCTION TO HANDLE OPENING/CLOSING THE COMPLETE MODAL
 * @param {Object} param0.cardRef                   REF CONTAINING DETAILS ABOUT A PROJECT CARD (AVATAR, TITLE,
 *                                                  SUBHEADER)
 * @param {Object} param0.project                   PROJECT OBJECT CONTAINING DETAILS ABOUT A PROJECT
 * @param {Object} param0.data                      OBJECT CONTAINING CHARACTER/EQUIPMENT/QUEST DATA
 * @param {Object} param0.completeSettings          REF CONTAINING THE SELECTED OPTIONS IN THE MODAL TO REFER BACK TO
 * @param {Function} param0.userDispatch            FUNCTION TO MODIFY USER STATE
 * @returns PROJECT COMPLETE MODAL JSX COMPONENT
 */
function ProjectCompleteModal({ completeModalOpen, setCompleteModalOpen, cardRef, project, data, completeSettings,
    userDispatch }) {
    return (
        <Modal
            open={completeModalOpen} onClose={() => setCompleteModalOpen(false)}
            closeAfterTransition BackdropComponent={Backdrop}
            BackdropProps={{ timeout: 500 }}
        >
            <Fade in={completeModalOpen}>
                <Box sx={MODAL_STYLE} className="standard-font">
                    <Grid container direction="column" gap={1}>
                        <CardHeader
                            avatar={cardRef.current.avatar}
                            title={cardRef.current.title}
                            subheader={cardRef.current.subheader}
                        />
                        <strong>
                            Complete Project
                        </strong>
                        <p>Are you sure you want to complete this project?</p>
                        <FormGroup>
                            {project.type === "character" &&
                                <>
                                <FormControlLabel control={<Checkbox defaultChecked
                                    onChange={(event, value) => completeSettings.current.save = value} />}
                                    label={"Save Character"} />
                                <FormHelperText>
                                    Save the character's end result to your collection.
                                </FormHelperText>
                                </>
                            }
                            <FormControlLabel control={<Checkbox defaultChecked
                                onChange={(event, value) => completeSettings.current.consume = value} />}
                                label={"Consume Inventory"} />
                            <FormHelperText>
                                Remove required project items from your inventory.
                            </FormHelperText>
                        </FormGroup>
                        <div className="mt-3 grid grid-cols-2 gap-1 w-full">
                            <Button variant="outlined" color="error" onClick={() => setCompleteModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="contained" color="primary" onClick={() => {
                                setCompleteModalOpen(false);
                                userDispatch({
                                    type: 'COMPLETE_PROJECT',
                                    payload: {
                                        project,
                                        data,
                                        settings: completeSettings.current
                                    },
                                });
                            }
                            }>
                                Confirm
                            </Button>
                        </div>
                    </Grid>
                </Box>
            </Fade>
        </Modal>
    );
}

/**
 * MANAGES THE PROJECT DELETE MODAL.
 * THE PROJECT DELETE MODAL WILL ALERT THE USER THAT THEIR DECISION TO DELETE THE PROJECT IS IRREVERSIBLE AND
 * HAS THE USER CLICK ON THE CHECKBOX AND CONFIRM BUTTON BEFORE PROCEEDING TO DELETE THE PROJECT.
 *
 * @param {Object} param0                          OBJECT CONTAINING THE FOLLOWING PROPERTIES
 * @param {boolean} param0.deleteModalOpen         BOOLEAN TO DETERMINE IF DELETE MODAL IS OPEN
 * @param {Object} param.cardRef                   REF CONTAINING DETAILS FOR PROJECT CARD (AVATAR, TITLE, SUBHEADER)
 * @param {Object} param.project                   PROJECT OBJECT CONTAINING DETAILS ABOUT A PROJECT
 * @param {Function} param0.userDispatch           FUNCTION TO MODIFY USER STATE
 * @returns PROJECT DELETE MODAL JSX COMPONENT
 */
function ProjectDeleteModal({ deleteModalOpen, setDeleteModalOpen, cardRef, project, userDispatch }) {
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    return (
        <Modal
            open={deleteModalOpen} onClose={() => {
                setDeleteConfirm(false);
                setDeleteModalOpen(false);
            }}
            closeAfterTransition BackdropComponent={Backdrop}
            BackdropProps={{ timeout: 500 }}
        >
            <Fade in={deleteModalOpen}>
                <Box sx={MODAL_STYLE} className="standard-font">
                    <Grid container direction="column" gap={1}>
                        <CardHeader
                            avatar={cardRef.current.avatar}
                            title={cardRef.current.title}
                            subheader={cardRef.current.subheader}
                        />
                        <strong>Delete Project</strong>
                        <p>Are you sure you want to <strong className="text-red-600">delete</strong> this project?</p>
                        <FormGroup>
                            <FormControlLabel control={<Checkbox checked={deleteConfirm}
                                onChange={(event, value) => setDeleteConfirm(value)} />}
                                label={"Yes, delete this project."} />
                            <FormHelperText>
                                <strong className="text-red-500">
                                    Deleted projects can not be restored.
                                </strong>
                            </FormHelperText>
                        </FormGroup>
                        <div className="mt-3 grid grid-cols-2 gap-1 w-full">
                            <Button variant="outlined" color="primary" onClick={() => {
                                setDeleteConfirm(false);
                                setDeleteModalOpen(false);
                            }}>
                                Cancel
                            </Button>
                            <Button variant="contained" color="error" disabled={!deleteConfirm} onClick={() => {
                                setDeleteModalOpen(false);
                                userDispatch({
                                    type: 'DELETE_PROJECT',
                                    payload: project
                                });
                            }
                            }>
                                Delete
                            </Button>
                        </div>
                    </Grid>
                </Box>
            </Fade>
        </Modal>
    );
}

/**
 * MANAGES THE PROJECT EDIT MODAL
 * THE PROJECT EDIT MODAL WILL ALLOW THE USER TO EDIT THE CONTENTS AND NAME OF THEIR PROJECT.
 *
 * @param {Object} param0                   OBJECT CONTAINING THE FOLLOWING PROPERTIES
 * @param {Object} param0.data              OBJECT CONTAINING CHARACTER/EQUIPMENT/QUEST DATA
 * @param {Object} param0.editProject       REF CONTAINING NEW PROJECT DETAILS TO REFER BACK TO LATER
 * @param {Object} param0.cardRef           REF CONTAINING DETAILS ABOUT A PROJECT CARD (AVATAR, TITLE, SUBHEADER)
 * @param {Object} param0.userState         OBJECT CONTAINING USER STATE (PROJECTS, INVENTORY, CHARACTER, ETC)
 * @param {Object} param0.userDispatch      FUNCTION TO MODIFY USER STATE
 * @param {boolean} param0.modalOpen        BOOLEAN TO DETERMINE IF MODAL IS OPEN
 * @param {Function} param0.setModalOpen    FUNCTION TO SET MODAL OPEN/CLOSE
 * @returns PROJECT EDIT MODAL JSX COMPONENT
 */
function ProjectEditModal({ data, editProject, cardRef, userState, userDispatch, modalOpen, setModalOpen }) {
    function closeModal(success) {
        if (success) {
            cardRef.current = buildCardRef(editProject.current);
            userDispatch({
                type: 'REPLACE_PROJECT',
                payload: editProject.current,
            });
        }
        setModalOpen(false);
    }
    return (
        <Modal
            open={modalOpen} onClose={() => setModalOpen(false)}
            closeAfterTransition BackdropComponent={Backdrop}
            BackdropProps={{ timeout: 500 }}
        >
            <Fade in={modalOpen}>
                <Box sx={MODAL_STYLE} className="w-[75vw] standard-font text-center">
                    {editProject.current.type === "character" && <EditCharacterProject {...{data,
                        project: editProject,
                        userState, userDispatch, closeModal }}
                    />}
                    {editProject.current.type === "item" && <EditItemProject {...{data,
                        project: editProject,
                        userState, closeModal }}
                    />}
                </Box>
            </Fade>
        </Modal>
    );
}

/**
 * BUILDS OR UPDATES A REF THAT CONTAINS DETAILS OF A PROJECT CARD (AVATAR, TITLE, SUBHEADER)
 *
 * @param {Object} project    OBJECT CONTAINING PROJECT DETAILS
 * @returns    OBJECT CONTAINING PROJECT CARD DETAILS TO ASSIGN INTO A REF
 */
function buildCardRef(project) {
    if (project.type === "character") {
        return {
            avatar: <Avatar
                src={`${process.env.PUBLIC_URL}/images/unit_icon/${project.details.avatar_id}.png`}
                alt={`project ${project.date} avatar`} />,
            title: project.details.name ?
                <>
                    <strong>{project.details.name}</strong><br />
                    {project.details.formal_name}
                </> : project.details.formal_name,
            subheader: <span>
                Rank {project.details.start.rank}<ArrowRightAltIcon/>Rank {project.details.end.rank}</span>,
        };
    }

    // item project card details
    const MAX_AVATARS = 3;
    let avatars = [];
    for (const id in project.required) {
        avatars.push(
            <Avatar src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
                alt={`avatar ${id}`} key={`project-${project.date}--avatar-${id}`} />
        );
        if (avatars.length >= MAX_AVATARS) {
            break;
        }
    }
    return {
        avatar: <AvatarGroup max={MAX_AVATARS}>{avatars}</AvatarGroup>,
        title: project.details.name,
        subheader: <span>{`${Object.keys(project.required).length} items`}</span>,
    };
}