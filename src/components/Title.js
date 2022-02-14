import React from "react";

/**
 * MANAGES THE MAIN PAGE TITLE
 */
export default function Title() {
    return (
        <div className="transition-all color-aliceblue text-center text-shadow-md font-bold py-3.5 mb-3 text-white">
            <div className="text-[5vw] sm:text-3xl">
                Princess Connect! Re:Dive
            </div>
            <div className="text-[4vw] sm:text-2xl tracking-widest">
                Quest Helper
            </div>
            <div className="text-red-500 text-[4vw] sm:text-2xl tracking-widest">
                (BETA)
            </div>
        </div>
    );
}