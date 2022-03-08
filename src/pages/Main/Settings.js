import React, { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';

export default function Settings({ userState, userDispatch, hidden }) {
    const [region, setRegion] = useState(userState.settings.region || 'JP');

    useEffect(() => {
        if (!userState.settings.region || userState.settings.region === "") {
            return;
        }
        if (region !== userState.settings.region) {
            setRegion(userState.settings.region);
        }
    }, [userState.settings.region]);

    function handleChange(event) {
        setRegion(event.target.value);
        userDispatch({
            type: 'SET_SETTINGS',
            payload: {
                key: "region",
                data: event.target.value
            },
        });
    }
    return (
        <Grid container direction="column" alignItems="center" justifyContent="center" gap={2} hidden={hidden}>
            <Alert severity="info" className="w-[75vw]">
                Quest related settings (quest range, sort options, item filter) are located in the <strong>
                Quest Drawer</strong>.<br />Enable some projects to be able to open the quest drawer and
                edit quest related settings.
            </Alert>
            <Card sx={{ width: "75vw", padding: 2 }}>
                <CardHeader
                    title={<Typography variant="h6">Game Region</Typography>}
                    subheader={"Change character names, equipment names, and equipment recipe used."}
                    action={
                    <FormControl className="mt-2">
                        <InputLabel id="region-setting-label">Game Region</InputLabel>
                        <Select
                            labelId="region-setting-label"
                            label="Game Region"
                            value={region}
                            onChange={handleChange}
                        >
                            <MenuItem value={"JP"}>Japan (JP)</MenuItem>
                            <MenuItem value={"CN"}>China (CN)</MenuItem>
                            <MenuItem value={"EN"}>English (EN)</MenuItem>
                            <MenuItem value={"KR"}>Korea (KR)</MenuItem>
                            <MenuItem value={"TW"}>Taiwan (TW)</MenuItem>
                        </Select>
                    </FormControl>}
                />
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        <code>priconne-quest-helper</code> is based off the Japan version of the game, but each game
                        region is currently at a different state. This means that equipment costs may be different or
                        may use different costs at certain periods of the game. <strong>Make sure this setting
                        matches your game region so that equipment calculations are as accurate as possible.</strong>
                        <br /><br />
                        If a certain equipment does not exist yet, the current Japanese recipe will be used as a fallback.
                    </Typography>
                </CardContent>
            </Card>
            <Card sx={{ width: "75vw", padding: 2 }}>
                <CardHeader
                    title={<Typography variant="h6">Reset Tip Alerts</Typography>}
                    subheader={"Allow temporary tip alerts to be shown again."}
                    action={<Button onClick={() => {
                        userDispatch({
                            type: "SET_SETTINGS",
                            payload: {
                                key: "alert",
                                data: {},
                            },
                        });
                    }}>Reset Tips</Button>}
                />
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        There are some temporary alerts that will be shown and can be closed. Resetting them will
                        allow them to be shown again until the next time they are closed. The page will need to be
                        refreshed for this to take effect.
                    </Typography>
                </CardContent>
            </Card>
            <Card sx={{ width: "75vw", padding: 2 }}>
                <CardHeader
                    title={<Typography variant="h6">Data Export and Import</Typography>}
                    subheader={"Transfer your priconne-quest-helper data between devices."}
                />
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        UNIMPLEMENTED
                    </Typography>
                </CardContent>
            </Card>
        </Grid>
    );
}