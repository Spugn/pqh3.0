import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

/**
 * HANDLES THE MIYAKO MENU TIP.
 * THIS ALERTS THE USER HOW TO OPEN THE MENU (BY CLICKING THE MIYAKO ICON).
 * WHEN THE USER CLOSES THIS ALERT, IT WILL BE SAVED TO USER STATE AND HIDDEN FOREVER.
 *
 * @param {Object} param0            OBJECT WITH THE FOLLOWING PROPERTIES
 * @param {Object} userState         OBJECT CONTAINING USER'S PROJECTS/INVENTORY/ETC
 * @param {Function} userDispatch    FUNCTION TO UPDATE USER'S PROJECTS/INVENTORY/ETC
 * @returns MIYAKO MENU TIP JSX COMPONENT
 */
export default function MiyakoMenuTip({ userState, userDispatch }) {
    const [hidden, setHidden] = useState(userState.settings?.alert?.miyakoMenuTip);

    return (
        <>
            <Collapse in={!hidden}>
                <Alert
                    action={
                        <IconButton color="inherit" size="small" onClick={() => {
                            setHidden(true);
                            userDispatch({
                                type: "SET_SETTINGS",
                                payload: {
                                    key: "alert",
                                    data: {
                                        ...userState?.alert,
                                        miyakoMenuTip: true,
                                    },
                                },
                            });
                        }}>
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    }
                    severity="info"
                    className="text-left mx-3"
                >
                    Click on the Miyako icon (<img className="inline-block h-7 w-7 mx-1 object-cover object-top"
                        loading="lazy" src={`${process.env.PUBLIC_URL}/images/webpage/miyako-menu.png`}
                        alt="miyako icon" />) to open the menu.
                </Alert>
            </Collapse>
        </>
    );
}