import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';

export default function Settings({ userState, userDispatch, hidden }) {
    const [legacy, setLegacy] = useState(userState.settings.use_legacy);
    const [legacy2, setLegacy2] = useState(userState.settings.use_legacy_2);
    return (
        <Grid container direction="column" alignItems="center" justifyContent="center" gap={2} hidden={hidden}>
            <Alert severity="info" className="w-[75vw]">
                Quest related settings (quest range, sort options, item filter) are located in the <strong>
                Quest Drawer</strong>.<br /> Enable some projects to be able to open the quest drawer and
                edit quest related settings.
            </Alert>
            <Card sx={{ width: "75vw", padding: 2 }}>
                <CardHeader
                    title={<Typography variant="h6">Use Legacy Version</Typography>}
                    subheader={"Reduce cost of some silver, gold, and purple rarity items."}
                    action={<Switch checked={legacy}
                        aria-label="Use Legacy Version"
                        onClick={() => {
                            if (!userState.settings.use_legacy && legacy2) {
                                setLegacy2(false);
                                userDispatch({
                                    type: "SET_SETTINGS",
                                    payload: {
                                        key: "use_legacy_2",
                                        data: false
                                    },
                                });
                            }
                            setLegacy(!userState.settings.use_legacy);
                            userDispatch({
                                type: "SET_SETTINGS",
                                payload: {
                                    key: "use_legacy",
                                    data: !userState.settings.use_legacy
                                },
                            });
                    }} />}
                />
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        As of <strong>August 30, 2019</strong>, the Japanese server released an update to reduce the
                        amount of items necessary to build some items. <strong className="italic">Servers using an
                        older version of the game may not have this change yet</strong>, so this setting must be
                        enabled to use the legacy recipe of some items. This setting can not be used together with
                        "Use Legacy Version 2".
                    </Typography>
                </CardContent>
            </Card>
            <Card sx={{ width: "75vw", padding: 2 }}>
                <CardHeader
                    title={<Typography variant="h6">Use Legacy Version 2</Typography>}
                    subheader={"Reduce cost of some silver, gold, purple, red, and green rarity items."}
                    action={<Switch checked={legacy2}
                        aria-label="Use Legacy Version 2"
                        onClick={() => {
                            if (!userState.settings.use_legacy_2 && legacy) {
                                // use_legacy_2 from false to true
                                console.log("legacy 2 from false to true");
                                setLegacy(false);
                                userDispatch({
                                    type: "SET_SETTINGS",
                                    payload: {
                                        key: "use_legacy",
                                        data: false
                                    },
                                });
                            }
                            setLegacy2(!userState.settings.use_legacy_2);
                            userDispatch({
                                type: "SET_SETTINGS",
                                payload: {
                                    key: "use_legacy_2",
                                    data: !userState.settings.use_legacy_2
                                },
                            });
                    }} />}
                />
                <CardContent>
                    <Typography variant="body2" color="text.secondary">
                        As of <strong>February 28, 2022</strong>, the Japanese server released yet another equipment
                        cost reduction update. <strong className="italic">Servers using an older version of the game
                        may not have this change yet</strong>, so this setting must be enabled to use the legacy_2
                        recipe of some items. This setting can not be used together with "Use Legacy Version".
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