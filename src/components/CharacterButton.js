import React, { useState } from 'react';
import CharacterImage from './CharacterImage';

export default function CharacterButton ({
        id,
        rank,
        callback = undefined,
        ignore_rank = false,
    }) {
    const [loaded, setLoaded] = useState(false);

    let button_css =
        "drop-shadow-md transition-all h-16 w-16 mx-0.5 hover:opacity-100 hover:grayscale-0";
    let rank_css = "relative font-bold text-white text-right text-xl text-shadow-lg mt-[-22px] top-[-4px] right-[4px]";
    if (!ignore_rank) {
        button_css += ` ${rank <= 0 ? "grayscale opacity-60" : ""}`;
        rank_css += ` ${rank <= 0 ? "hidden" : ""}`;
    }
    else {
        rank_css += " hidden";
    }
    if (callback !== undefined) {
        button_css += " cursor-pointer";
    }

    return (
        <button onClick={callback !== undefined ? callback : () => {}} className={button_css}>
            {!loaded && <CharacterImage id="999999" alt="loading" />}
            <CharacterImage id={id} onLoad={() => setLoaded(true)} hidden={!loaded} />
            <div className={rank_css}>
                {rank}
            </div>
        </button>
    );
}