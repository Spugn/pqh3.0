import React, { useState } from 'react';

export default React.memo(function ItemButton ({
        id,
        quantity,
        callback = () => {},
        ignore_quantity = false,
        use_skeleton = true,
    }) {
    const [loaded, set_loaded] = useState(false);
    if (loaded) {
        // debug().log('components/ItemButton', `Rendering: ${JSON.stringify({id, quantity, ignore_quantity})}`);
    }

    let button_css = "cursor-pointer drop-shadow-md transition-all h-12 w-12 hover:grayscale-0";
    let quantity_css = "font-mono relative before:content-['×'] font-bold text-white text-right text-shadow-lg mt-[-18px] top-[-4px] right-[3px]";
    if (!ignore_quantity) {
        button_css += ` ${quantity <= 0 ? "grayscale" : ""}`;
        quantity_css += ` ${quantity <= 0 ? "hidden" : ""}`;
    }
    else {
        quantity_css += " hidden";
    }
    // USING '×' INSTEAD OF '\u00D7' OR '\\00D7' BECAUSE THERE WERE ISSUES WITH THE LATTER NOT RENDERING.

    if (use_skeleton) {
        // using skeleton renders a lot more (2x, 1 for initial render and another for img load)
        return (
            <button onClick={callback} className={button_css}>
                {!loaded && <img className="rounded" src={`${process.env.PUBLIC_URL}/images/items/999999.png`} />}
                <img src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
                    alt={`item ${id}${ignore_quantity ? "" : ` quantity ${quantity}`}`}
                    onLoad={ () => set_loaded(true) }
                    hidden={!loaded} />
                <div className={quantity_css}>
                    {quantity}
                </div>
            </button>
        );
    }
    return (
        <button onClick={callback} className={button_css}>
            <img src={`${process.env.PUBLIC_URL}/images/items/${id}.png`}
                alt={`item ${id}${ignore_quantity ? "" : ` quantity ${quantity}`}`} />
            <div className={quantity_css}>
                {quantity}
            </div>
        </button>
    );
}, (prev, next) => {
    if (prev.quantity !== next.quantity) {
        return false;
    }
    if (prev.quantity && !next.quantity) {
        return false;
    }
    if (prev.id !== next.id) {
        return false;
    }
    return true;
});