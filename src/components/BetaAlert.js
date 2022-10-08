import React from "react";
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

export default function BetaAlert() {
    return (
        <Alert severity="error" className="mx-3 mb-2">
            <AlertTitle>
                priconne-quest-helper IS CURRENTLY IN BETA.
            </AlertTitle>
            - All planned features are not implemented at this time.<br/>
            - <strong>There may also be uncaught errors or bugs.</strong><br />
            - Saved user data may also be incompatible with later versions.<br />
            - Please visit <a href="https://github.com/Spugn/priconne-quest-helper" className="font-bold">
                https://github.com/Spugn/priconne-quest-helper</a> to follow development.
            - UPDATE (October 8, 2022): <a href="https://github.com/Spugn/priconne-quest-helper#development-update-october-8-2022" className="font-bold">development-update-october-8-2022</a>
        </Alert>
    );
}