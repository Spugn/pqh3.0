import React, { useState, useEffect } from 'react';
import CharacterButton from './CharacterButton';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * THIS IS AN EXPENSIVE COMPONENT. MAKE SURE IT STAYS RENDERED ON THE DOM.
 */
export default React.memo(function CharacterCatalog({ data, callback, keyPrefix }) {
    const [loading, setLoading] = useState(false);
    const [characters, setCharacters] = useState([]);

    useEffect(() => {
        // USE setTimeout HERE SO WE CAN DISPLAY A SPINNER WHILE OUR COMPONENT LOADS
        setTimeout(() => {
            let t_characters = [];
            Object.entries(data.character.data).forEach(([id, value]) => {
                t_characters.push(
                    <CharacterButton {...{id, rank: 0, ignore_rank: true, callback: () => callback(id)}} key={`${keyPrefix}-character-catalog--${id}`} />
                );
            });
            setCharacters(t_characters);
            setLoading(false);
        });
    }, [data.character.data, keyPrefix, callback]);

    return (
        <div>
            {loading && <CircularProgress disableShrink color="secondary" />}
            {characters}
        </div>
    );
}, () => {
    // NEVER RE-RENDER THIS COMPONENT
    return true;
})