import React from "react";

export default function CharacterImage({
    id,
    alt,
    className,
    hidden,
    defaultSize,
    onLoad = () => {},
}) {
    return (
        <img src={`${process.env.PUBLIC_URL}/images/unit_icon/${id}.png`}
            className={`${className || ""}${defaultSize && "h-16 w-16"} rounded`}
            alt={`${alt || `character image ${id}`}`}
            onLoad={onLoad}
            hidden={hidden} />
    );
}