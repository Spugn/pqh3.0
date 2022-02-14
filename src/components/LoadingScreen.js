import React, { useState, useEffect } from 'react';
import _CONSTANTS from '../scripts/constants';

/**
 * MANAGES THE LOADING SCREEN
 * @param {boolean} loading          IF TRUE, KEEP LOADING SCREEN VISIBLE. IF FALSE, HIDE LOADING SCREEN AND DELETE.
 * @param {boolean} dataReadError    IF TRUE, DISPLAY ERROR MESSAGE
 */
export default function LoadingScreen({ loading, dataReadError }) {
    const [hide, setHide] = useState(false);
    const [deleted, setDeleted] = useState(false);

    useEffect(() => {
        // only call this once
        document.body.classList.add('loading-screen--show');
    }, []);

    useEffect(() => {
        if (loading) {
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
    }, [loading]);

    if (deleted) {
        return (<></>);
    }

    return (
        <>
            <div id="page-loading" className={`${hide ? "end" : ""} ${dataReadError ? "data-read-error" : ""}`}>
                <div id="page-cover" />
                <div id="loading-div">
                    <i id="miyako" />
                    {dataReadError ?
                        <div id="loading-text">
                            error reading <code>{_CONSTANTS.DATA_LOCATION}</code>
                        </div>
                        :
                        <div id="loading-text">
                            Miyako is coming for your pudding.<br/>Please wait.
                        </div>
                    }
                </div>
            </div>
        </>
    );
}