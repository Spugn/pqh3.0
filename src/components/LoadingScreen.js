import React, { useState, useEffect, useRef } from 'react';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import _CONSTANTS from '../scripts/constants';

/**
 * MANAGES THE LOADING SCREEN
 * @param {boolean} loading          IF TRUE, KEEP LOADING SCREEN VISIBLE. IF FALSE, HIDE LOADING SCREEN AND DELETE.
 * @param {boolean} dataReadError    IF TRUE, DISPLAY ERROR MESSAGE
 */
export default function LoadingScreen({ loading, dataReadError, userState, userDispatch }) {
    const [hide, setHide] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const [pause, setPause] = useState(false);
    const [noFade, setNoFade] = useState(false);
    const setupRegion = useRef(false);
    const [region, setRegion] = useState('JP');

    useEffect(() => {
        // only call this once
        document.body.classList.add('loading-screen--show');
    }, []);

    useEffect(() => {
        if (loading) {
            return;
        }
        requestRegion();
    }, [loading]);

    function requestRegion() {
        if (!userState.settings.region && !setupRegion.current) {
            setTimeout(() => {
                setNoFade(true);
                setPause(true);
                setupRegion.current = true;
            }, 2000);
            return;
        }
        if (setupRegion.current) {
            document.body.classList.remove('loading-screen--show');
            setHide(true);

            // after 2s, delete the loading screen
            setTimeout(() => {
                setDeleted(true);
            }, 2000);
            return;
        }
        setTimeout(() => {
            // remove class from body and "hide" the loading screen
            document.body.classList.remove('loading-screen--show');
            setHide(true);

            // after 2s, delete the loading screen
            setTimeout(() => {
                setDeleted(true);
            }, 2000);
        }, 2000);
    }

    function handleChange(event) {
        setRegion(event.target.value);
    }

    if (deleted) {
        return (<></>);
    }

    return (
        <>
            <div id="page-loading" className={`${hide ? "end" : ""} ${dataReadError ? "data-read-error" : ""} ${pause ? "pause" : ""}`}>
                <div id="page-cover" />
                <div id="loading-div">
                    <i id="miyako" className={`${noFade ? "no-fade" : ""}`} />
                    {dataReadError &&
                        <div id="loading-text">
                            error reading <code>{_CONSTANTS.DATA_LOCATION}</code>
                        </div>
                    }
                    {pause &&
                        <div id="loading-text" className="bg-white text-black rounded-md">
                            Select your <strong>Game Region</strong><br />
                            (this can be changed later in <code>Settings</code>)<br />
                            <FormControl className="mt-2">
                                <InputLabel id="region-setup-label">Game Region</InputLabel>
                                <Select
                                    labelId="region-setup-label"
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
                            </FormControl><br />
                            <Button variant="contained" className="mb-2 mt-2" onClick={() => {
                                setPause(false);
                                userDispatch({
                                    type: 'SET_SETTINGS',
                                    payload: {
                                        key: "region",
                                        data: region
                                    },
                                });
                                console.log("region set to", region);
                                requestRegion();
                            }}>Confirm</Button>
                        </div>
                    }
                    {!dataReadError && !pause && !setupRegion.current &&
                        <div id="loading-text">
                            Miyako is coming for your pudding.<br/>Please wait.
                        </div>
                    }
                </div>
            </div>
        </>
    );
}