import React, { useState, createContext, useEffect, useReducer, useMemo, useRef } from 'react';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { yellow, green, red } from '@mui/material/colors';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import ItemButton from './ItemButton';
import _data_utils from '../scripts/dataUtils';

export default function Project({ data, project, projectMap, projectRef, userDispatch, listFunctions, children }) {
    const [expand, setExpand] = useState(false);
    const [enabled, setEnabled] = useState(projectRef.current.status.enabled);
    const [prioritized, setPrioritized] = useState(projectRef.current.status.prioritized);
    const [completed, setCompleted] = useState(projectRef.current.status.completed);
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const transparent = !(enabled || expand);

    function handleExpand(close) {
        if (close) {
            setExpand(false);
            return;
        }
        listFunctions().expandProject([project.date, handleExpand]);
        setExpand(!expand);
    }

    function handleMenuClick(event) {
        setAnchorEl(event.currentTarget);
    }

    function handleMenuClose() {
        setAnchorEl(null);
    }

    function toggleEnabled() {
        projectMap.current.get(project.date)[0] = !enabled;
        projectRef.current.status.enabled = !enabled;
        setEnabled(!enabled);
        userDispatch({ type: 'TEST' });
    }

    function togglePrioritized() {
        project.priority = !prioritized;
        projectRef.current.status.prioritized = !prioritized;
        setPrioritized(!prioritized);
        userDispatch({ type: 'TEST' });
        //listFunctions().forceRender();
    }

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

    function ProjectStatus({ tooltipText, icon }) {
        return (
            <Chip icon={icon} label={tooltipText} size="small" variant="outlined" />
        );
    }

    return (
        <Card className={`${transparent ? "opacity-80" : ""} ${expand ? 'w-[100%]' : 'w-[400px]'}`} sx={{minHeight: 155}}>
            <CardHeader
                avatar={projectRef.current.components.avatar}
                action={<IconButton onClick={handleMenuClick}><MoreVertIcon /></IconButton>}
                title={projectRef.current.components.title}
                subheader={projectRef.current.components.subheader}
                sx={{ // HIDE LONG TITLE OVERFLOW
                    display: "flex",
                    overflow: "hidden",
                    "& .MuiCardHeader-content": {
                      overflow: "hidden"
                    }
                }}
            />
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
                    {prioritized && <ProjectStatus {...{tooltipText: "Priority", icon: <StarIcon />}} />}
                    {completed && <ProjectStatus {...{tooltipText: "Complete", icon: <CheckIcon />}} />}
                </Stack>
                <ExpandMore expand={expand} onClick={() => handleExpand()}>
                    <Tooltip title="More details" placement="top" arrow>
                        <ExpandMoreIcon />
                    </Tooltip>
                </ExpandMore>
            </CardActions>
            <Collapse in={expand} timeout="auto" unmountOnExit>
                <CardContent>
                    {children}
                </CardContent>
            </Collapse>
            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    handleMenuClose();
                    projectRef.current.functions.openEditModal();
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
                    handleMenuClose();
                    console.log("we completing");
                    projectMap.current.delete(project.date);
                    userDispatch({
                        type: 'COMPLETE_PROJECT',
                        payload: {
                            project,
                            data
                        },
                    });
                }}>
                    <ListItemIcon><CheckIcon sx={{color: green[700]}} /></ListItemIcon>
                    <ListItemText primary="Complete" />
                </MenuItem>
                <MenuItem onClick={() => {
                    handleMenuClose();
                    console.log("we deleting project", project.date);
                    projectMap.current.delete(project.date);
                    userDispatch({
                        type: 'DELETE_PROJECT',
                        payload: project
                    });
                }}>
                    <ListItemIcon><DeleteIcon sx={{color: red[500]}} /></ListItemIcon>
                    <ListItemText primary="Delete" />
                </MenuItem>
            </Menu>
        </Card>
    );
}

function CharacterProject({ data, project, projectMap, userState, userDispatch, listFunctions }) {
    const inventoryRef = useRef(checkInventory({ data, project, userState }));
    const inventoryCheck = checkInventory({ data, project, userState });
    useEffect(() => {
        console.log("project priority changed");
    }, [project.priority]);

    useEffect(() => {

    }, []);

    const projectRef = useRef({
        components: {
            avatar: <Avatar><img src={`${process.env.PUBLIC_URL}/images/unit_icon/${project.details.avatar_id}.png`} /></Avatar>,
            title: project.details.name ?
                <>
                    <strong>{project.details.name}</strong><br />
                    {project.details.formal_name}
                </> : project.details.formal_name,
            subheader: <span>Rank {project.details.start.rank}<ArrowRightAltIcon />Rank {project.details.end.rank}</span>,
        },
        status: {
            enabled: projectMap.current.get(project.date)[0],
            prioritized: project.priority,
            completed: inventoryCheck[0],
        },
        functions: {
            openEditModal,
        },
    });

    return (
        <Project {...{ data, project, projectMap, projectRef, userDispatch, listFunctions }}>
            <Grid container direction="column" alignItems="center" justifyContent="center" gap={5}>
                <div className="w-full">
                    <Divider textAlign="left" className="mb-3"><strong>Rank {project.details.start.rank}</strong> (start)</Divider>
                    <Grid container direction="row" alignItems="center" justifyContent="center" gap={0.5}>
                        {data.character.data[project.details.avatar_id].equipment[`rank_${project.details.start.rank}`] ?
                        data.character.data[project.details.avatar_id].equipment[`rank_${project.details.start.rank}`].map((id, index) => {
                            return (
                                <img src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
                                    className={`h-12 w-12 ${project.details.start.equipment[index] ? "" : "grayscale opacity-50"}`}
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
                    <Divider textAlign="left" className="mb-3"><strong>Rank {project.details.end.rank}</strong> (end)</Divider>
                    <Grid container direction="row" alignItems="center" justifyContent="center" gap={0.5}>
                        {data.character.data[project.details.avatar_id].equipment[`rank_${project.details.end.rank}`] ?
                        data.character.data[project.details.avatar_id].equipment[`rank_${project.details.end.rank}`].map((id, index) => {
                            return (
                                <img src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
                                    className={`h-12 w-12 ${project.details.end.equipment[index] ? "" : "grayscale opacity-50"}`}
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
                <RequiredAndMissing {...{ project, inventoryCheck }} />
            </Grid>
        </Project>
    );

    function openEditModal() {
        console.log("open char proj edit modal here");
        listFunctions().openCharacterEditModal(project);
    }
}

function ItemProject({ data, project, projectMap, userState, userDispatch, listFunctions }) {
    const MAX_AVATARS = 3;
    let avatars = [], avatarCounter = 0;
    for (const id in project.required) {
        avatars.push(<Avatar
            src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
            alt={`avatar ${id}`} key={`project-${project.date}--avatar-${id}`} />);
        if (++avatarCounter >= MAX_AVATARS) {
            break;
        }
    }
    const avatarGroup = <AvatarGroup max={MAX_AVATARS}>{avatars}</AvatarGroup>;
    const projectRef = useRef({
        components: {
            avatar: avatarGroup,
            title: project.details.name,
            subheader: <span>{`${Object.keys(project.required).length} items`}</span>,
        },
        status: {
            enabled: projectMap.current.get(project.date)[0],
            prioritized: project.priority,
            completed: false, // todo, check if user has enough in inventory
        },
        functions: {
            openEditModal,
        },
    });
    return (
        <Project {...{ data, project, projectMap, projectRef, userDispatch, listFunctions }}>
            <Typography>item list, cus item project</Typography>
        </Project>
    );

    function openEditModal() {
        console.log("open item proj edit modal here");
    }
}

function checkInventory({ data, project, userState }) {
    console.log("CHECK INVENTORY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    return [false, {"101011": 1}];
    //return _data_utils(data).project.check(project, userState.inventory);
}

function RequiredAndMissing({ project, inventoryCheck }) {
    const [requiredItems, setRequiredItems] = useState([]);
    const [missingItems, setMissingItems] = useState([]);
    const requiredEntries = useRef(Object.keys(project.required).length);
    const missingEntries = useRef(Object.keys(inventoryCheck[1]).length);
    const requiredCount = useRef(0);
    const missingCount = useRef(0);
    console.log("inventory check", inventoryCheck);
    console.log("project", project);
    useEffect(() => {
        requiredEntries.current = Object.keys(project.required).length;
        missingEntries.current = Object.keys(inventoryCheck[1]).length;
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
            [...Object.keys(inventoryCheck[1])].map((id, index) => {
                missingCount.current += inventoryCheck[1][id];
                return (
                    <ItemButton {...{
                        id,
                        quantity: inventoryCheck[1][id],
                        }} key={`project-details--required-${index}-${id}`} />
                );
            }).sort((a, b) => b.props.quantity - a.props.quantity) // SORT BY QUANTITY, DESCENDING
        );
    }, []);

    return (
        <>
            <div className="w-full">
                <Divider textAlign="left" className="mb-3">
                    <strong>Required Items</strong> ({requiredEntries.current} entries, {requiredCount.current} items)
                </Divider>
                <Grid container direction="row" alignItems="center" justifyContent="center" gap={0.3}>
                    {requiredItems}
                </Grid>
            </div>
            {missingEntries.current > 0 && // only render missing items if there are any
                <div className="w-full">
                    <Divider textAlign="left" className="mb-3">
                        <strong>Missing Items</strong> ({missingEntries.current} entries, {missingCount.current} items)
                    </Divider>
                    <Grid container direction="row" alignItems="center" justifyContent="center" gap={0.3}>
                        {missingItems}
                    </Grid>
                </div>
            }
        </>
    );
}

export { CharacterProject, ItemProject };