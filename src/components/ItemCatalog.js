import React, { useState, useRef, useEffect } from 'react';
import ItemButton from './ItemButton';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';

/**
 * THIS IS AN EXPENSIVE COMPONENT. MAKE SURE IT STAYS RENDERED ON THE DOM.
 *
 * With how material-ui tabs are designed, to hide the ItemCatalog, if needed, you need to
 * set the parent container to have "visibility: hidden, width: 0, height: 0" in CSS.
 */
export default function ItemCatalog({ data, callback, keyPrefix, hidden,
    includeFragment = false, onlyFragment = false }) {
    const MAX_AVATARS = 3;
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const items = useRef(new Map());
    const avatars = useRef(new Map());

    useEffect(() => {
        // USE setTimeout HERE SO WE CAN DISPLAY A SPINNER WHILE OUR COMPONENT LOADS
        setTimeout(() => {
            const tItems = new Map(), tAvatars = new Map();
            Object.entries(data.equipment.data).forEach(([id, value]) => {
                const entry = <ItemButton {...{
                    id,
                    quantity: 0,
                    ignore_quantity: true,
                    callback: () => callback(id),
                }} key={`${keyPrefix}-inventory-catalog--${id}`} />;
                const fragment_entry = <ItemButton {...{
                    id: value.fragment.id,
                    quantity: 0,
                    ignore_quantity: true,
                    callback: () => callback(value.fragment.id),
                }} key={`${keyPrefix}-inventory-catalog--fragment-${id}`} />;

                const avatar = <Avatar {...{
                    src: `${process.env.PUBLIC_URL}/images/items/${id}.png`,
                    variant: "rounded",
                }} alt={`item ${id}`} key={`${keyPrefix}-inventory-catalog-avatar--${id}`} />;
                if (!tItems.has(value.rarity)) {
                    tItems.set(value.rarity, []);
                    tAvatars.set(value.rarity, []);
                }

                if (tAvatars.get(value.rarity).length < MAX_AVATARS) {
                    tAvatars.get(value.rarity).push(avatar);
                }

                if (includeFragment && onlyFragment) {
                    if (value.fragment.id === "999999") {
                        tItems.get(value.rarity).push(entry);
                        return;
                    }
                    tItems.get(value.rarity).push(fragment_entry);
                    return;
                }

                tItems.get(value.rarity).push(entry);
                if (includeFragment && value.fragment.id !== "999999") {
                    tItems.get(value.rarity).push(fragment_entry);
                }
            });
            items.current = new Map([...tItems.entries()].sort((a, b) => a[0] - b[0]));; // sort by rarity low -> high
            avatars.current = new Map([...tAvatars.entries()].sort((a, b) => a[0] - b[0])); // sort by rarity low->high
            setLoading(false);
        });
    }, []);

    return (
        <div>
            {loading && <CircularProgress disableShrink color="secondary" />}
            {(!loading && !hidden) && <div>
                <Tabs variant="scrollable"
                    indicatorColor="secondary"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    className="sticky top-0 z-10 bg-white"
                    onChange={(event, value) => {
                        setTab(value);
                    }}
                    value={tab}>
                    {[...avatars.current.keys()].map((rarity) => {
                        return <Tab icon={
                            <AvatarGroup max={MAX_AVATARS}>
                                {avatars.current.get(rarity)}
                            </AvatarGroup>
                        } key={`${keyPrefix}-inventory-catalog-rarity-tab--${rarity}`} />;
                    })}
                </Tabs>
                <Grid
                    container
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    gap={0.3}>
                    {Array.from(items.current.values())[tab]}
                </Grid>
            </div>}
        </div>
    );
}