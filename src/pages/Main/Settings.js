import React, { useRef } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';

export default function Settings({ userState, userDispatch, hidden }) {
    const defaultLegacy = useRef(userState.settings.use_legacy); // need for defaultChecked else error
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
                    action={<Switch value={userState.settings.use_legacy}
                        defaultChecked={defaultLegacy.current}
                        aria-label="Use Legacy Version"
                        onClick={() => {
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
                        enabled to use the legacy recipe of some items.
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