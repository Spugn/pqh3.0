import React from "react";
import { slide as Menu } from 'react-burger-menu';
import _CONSTANTS from "../scripts/constants";

/**
 * MANAGES THE BURGER MENU.
 * THE BURGER MENU IS A SLIDE-IN MENU WITH A BACKGROUND WHERE USERS CAN PRESS BUTTONS TO NAVIGATE TO OTHER PAGES.
 * @param {boolean} menuOpen           IF TRUE, KEEP MENU OPEN. IF FALSE, CLOSE MENU.
 * @param {Function} setMenuOpen       SETS THE MENU OPEN OR CLOSED.
 * @param {String} currentPage         THE CURRENT PAGE ID.
 * @param {Function} setCurrentPage    SETS THE CURRENT PAGE ID.
 * @returns {React.Component}
 */
export default function BurgerMenu({ menuOpen, setMenuOpen, currentPage, setCurrentPage }) {
    /**
     * HANDLES A MENU ITEM CLICK. CHANGES THE PAGE ID TO SOMETHING NEW.
     *
     * @param {String} text     PAGE ID TO SWITCH TO
     * @param {Object} event    CLICK EVENT OBJECT
     */
    function handleMenuClick(text, event) {
        event.preventDefault();
        setCurrentPage(text);
        setMenuOpen(false);
    }

    /**
     * USED IN react-burger-menu's onStateChange HANDLER.
     *
     * @param {OBJECT} state    MENU STATE
     */
    function handleStateChange(state) {
        setMenuOpen(state.isOpen);
    }

    return (
        <Menu isOpen={menuOpen}
            onStateChange={state => handleStateChange(state)}>
            <MenuTitle />
            <MenuItem {...{ pageID: _CONSTANTS.PAGE_CATEGORIES.HOME, text: "Home" }} />
            <MenuItem {...{ pageID: _CONSTANTS.PAGE_CATEGORIES.CHARACTERS, text: "Characters" }} />
            <MenuItem {...{ pageID: _CONSTANTS.PAGE_CATEGORIES.INVENTORY, text: "Inventory" }} />
            <MenuItem {...{ pageID: _CONSTANTS.PAGE_CATEGORIES.SETTINGS, text: "Settings" }} />
            <br />
            <MenuFooter />
        </Menu>
    );

    /**
     * MANAGES THE BURGER MENU'S MENU ITEM.
     *
     * @param {String} pageID    PAGE ID OF THE MENU ITEM. USED WHEN SWITCHING FROM ONE PAGE TO ANOTHER
     * @param {String} text      TEXT TO DISPLAY ON THE MENU ITEM
     * @returns {React.Component}
     */
    function MenuItem({ pageID, text }) {
        const contents = (
            <>
                <img className="h-[37.61px] float-right relative bottom-[5px]"
                    src={`${process.env.PUBLIC_URL}/images/webpage/${pageID}.png`}
                    loading="lazy"
                    alt={`${pageID} icon`} />
                <span>{text}</span>
            </>
        );
        if (pageID === currentPage) {
            // current page is loaded
            return (
                <div className="bm-item bm-item-current">
                    {contents}
                </div>
            );
        }
        return (
            // current page is not loaded
            <div className="bm-item"
                onClick={(event) => handleMenuClick(pageID, event)}>
                {contents}
            </div>
        );
    }
}

/**
 * MANAGES THE BURGER MENU'S TITLE.
 *
 * @returns {React.Component}
 */
function MenuTitle() {
    return (<div>priconne-quest-helper</div>);
}

/**
 * MANAGES THE BURGER MENU'S FOOTER. CONTAINS SOCIAL MEDIA LINKS AND CREDITS.
 * @returns {React.Component}
 */
function MenuFooter() {
    return (
        <div className="bm-footer text-center">
            <span className="standard-font tracking-wider">Made with ❤ by S'pugn</span><br />
            <a className="inline-block relative top-[2px] right-[5px] mr-3" href={"https://ko-fi.com/E1E21KEV4"}
                target="_blank" rel="noreferrer">
                <img className="h-[36px] border-0"
                    src="https://cdn.ko-fi.com/cdn/kofi3.png?v=2"
                    alt="Buy Me a Coffee at ko-fi.com" />
            </a>
            <a className="inline-block" href="https://github.com/Spugn/priconne-quest-helper" target="_blank" rel="noreferrer">
                <img className="invert"
                    src={`${process.env.PUBLIC_URL}/images/webpage/GitHub-Mark.png`}
                    alt="GitHub icon" />
            </a>
        </div>
    );
}
