import React from 'react';
import Link from '@mui/material/Link';
import "./NotFound.css";

/**
 * DISPLAYS WHENEVER AN INVALID PAGE IS TRIED TO BE ACCESSED.
 *
 * @returns {React.Component}
 */
export default function NotFound() {
    return (
        <>
            <div id="loading404" className="fixed translate-50 top-2/4 left-[51%] z-[-1] text-center">
                <i id="miyako404" className="mt-[-30vh]"></i>
            </div>
            <div className="text-4xl text-center text-shadow-md bg-black/[0.3] p-10">
                <div className="text-red-400 mb-5">404 - Page Not Found</div>
                <Link color="yellow" href="" underline="none">
                    Return to Main Page
                </Link>
            </div>
        </>
    );
}