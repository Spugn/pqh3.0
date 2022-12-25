# Changelog
All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.2] - 2022-12-24
### Added
- Compact Project Cards
  - Suggested by `Tomo#5563`
  - Reduce the size of project cards so that more can be displayed at once on wide screens with this setting enabled.
- Keep Enabled Projects
  - Suggested by `Tomo#5563`
  - Enabled projects will persist between sessions with this setting enabled.

## [3.1.1] - 2022-12-23
### Added
- Project Priority Levels
  - Suggested by `Tomo#5563`
  - Projects can now have different levels of priority (max 10)
  - The higher the priority, the higher the project will appear on quest list
  - The higher the priority, the higher value the project's items will have in quests
    - e.g. if a project has a priority level of `5` then an item's score will be calculated as:
      - `item_score = drop_rate * priority_level`
- Added "Amount Buttons" to Inventory Editing Dialogs
  - Suggested by `Tomo#5563`
  - Added "Amount Buttons" (buttons with +10/+5/+1/-10/-5/-1) to inventory page and expanded project display inventory editor dialogs
- Add "Expand In Full" icon to the side of the quest ID button in quest list to make it more clear that it can be clicked
  - Suggested by `Wazhai#0161`
- Added "menu" below the Miyako Open Menu button to make it more clear that it's for opening the menu
  - Suggested by `Wazhai#0161`
- Inventory Page - Alternative Mode
  - Suggested by `Zerooo#3807`
  - Enable this mode in Settings
  - Basically, displays all items + fragments in inventory with inputs below them for quick bulk inventory editing
  - Inventory Page will load slower with this mode enabled due to loading every item + fragment
### Changed
- Switched to a darker colored yellow for the priority project gradient in hopes of making it less blinding
  - Suggested by `Tomo#5563`
### Fixed
- Fixed an issue where all number inputs could have decimals when whole numbers are expected

## [3.1.0] - 2022-12-21
Beta v2 start: React to SvelteKit Migration
### Added
- Migrated from `React` to `SvelteKit v1.0`
- Data Pages
  - Character Data
  - Item Data
  - Quest Data
  - Statistics
- Data Importing and Exporting
  - Added support to import data from `expugn/priconne-quest-helper`
- Changes to settings
  - The React version of settings are auto-migrated to the newer version
- New project card format
  - Project cards can be expanded by clicking on the thumbnail (or clicking Expand in the project menu)
  - When a project is expanded, you can "Partially Complete" your project by clicking on an item in the
    "Required Items" section
  - When a project is expanded, you can "Edit Inventory" by clicking on an item in the "Required Fragments" or
    "Missing Fragments" section
  - Project cards will now display their completion %
  - Item Project names are now optional (previously required)
- Modified project creation
  - When selecting a character for a character project, you can now Search for a specific name or ID
  - Ignored Rarities for project creation will stay the same for the session (so you don't need to keep clicking the buttons)
  - Moved "Create Project"/"Edit Project" back to the bottom actions
    - This was the same behavior as the React version, but it was changed with SvelteKit's initial version
    - Some projects required you to scroll down to confirm your changes, which made it annoying to create/edit projects
    - Suggested by `Wazhai#0161`
- Quest dialog changes
  - Items can be clicked in the quest dialog to open an "Edit Inventory" dialog
  - The quest id can be clicked to open a dialog that shows information for all items similar to how the React version worked
  - Added `required/total_required` display, moved drop rate % to be above the quest item
    - Suggested by `Wazhai#0161`
- Quest score calculation changes
  - The amount of required items now influences the quest score a little
    - `quest_score += (required_amount / 9999) * 1000`
- Character page changes
  - You can now search for a specific character name or ID in the character page
  - You can now enable "Consume Inventory" when manually editing characters to remove newly added items from your inventory
    - Suggested by `NoahVerum#7732`
- Inventory page changes
  - Changed how "Add Items" work, you can now select fragments directly
  - Added a "Delete All Items" button to delete all items in your inventory if desired
  - Added rarity and amount sorting options
    - Suggested by `Zerooo#3807`
- Settings page changes
  - Add new setting: `Hide Unreleased Content`
    - This will hide unreleased characters or items that are not available in your Game Region
  - Add new setting: `Auto Enable Projects`
    - This will enable all projects at startup and project creation (by default, projects start disabled)
  - Added quest settings in the setting page
    - Added more detail to quest settings
- Character Data Page (changes from `expugn/priconne-quest-helper` listed below)
  - Added search option, search and filter for a specific character name and ID
  - Added "Character Names" section to display all supported regional names
  - Added "Image Assets" section to display the full/unmodified version of unit_icon and unit_still
  - Specific character pages should have a different embed now when sharing links
- Item Data Page (changes from `expugn/priconne-quest-helper` listed below)
  - Added search option, search and filter for a specific equipment name and ID
  - Moved "Rank Filter" to somewhere more visible
  - Added "Equipment Names" section to display all supported regional names for the full and fragment version of an item
  - Cleaned up recipe display, now there's only 1 display but you can select which region to use
  - The "Character Usage" section automatically takes your `spugn/priconne-quest-helper` character status and grayscales
    any character you don't own
  - Added "Image Assets" section to display the full/unmodified version of item/fragment icons
- Quest Data Page (changes from `expugn/priconne-quest-helper` listed below)
  - Region select moved to bottom of window, so you don't need to scroll up to change regions anymore
- Statistics Data Page (changes from `expugn/priconne-quest-heper` listed below)
  - Removed regional support
    - Theres a fatal flaw with how data is currently organized, where it's impossible to tell which rank that a region
      currently has available. This makes the statistics page inaccurate if regional support was enabled
### Removed
- Removed "Reset Tip Alerts" setting

## [3.0.6] - 2022-03-11
### Fixed
- Fixed a bug reported by `Aquastic#1522`
  - Trying to edit a character project will crash the webpage
  - Crash happens because the way character names are retrieved from data was changed

## [3.0.5] - 2022-03-07
### Added
- Multi-Region Support
  - Players must now choose their game region (if not chosen, they will be prompted to at start).
  - Depending on game version, equipment names, character names, and equipment recipes will be adjusted.
- New `pqh-updater`
- New `data.json` format
  - `character.name` now includes multiple region names
  - `equipment.name` now includes multiple region names
  - `equipment.fragment.name` now includes multiple region names
  - `equipment.recipes` now includes multiple region recipes
- New loading screen region prompt
  - Loading screen will now ask user to choose their game region if `userState.settings.region` doesn't exist
- Project Builder will now use regional name, or JP as a fallback
- Characters page will now use regional name, or JP as a fallback
- Inventory page will now use regional name, or JP as a fallback
### Removed
- Old `pqh-updater`
  - `get_cn_database.js`
  - `get_legacy_database.js`
  - `setup_data.js`
  - `vendor/Coneshell`

## [3.0.4] - 2022-02-28
### Added
- Legacy Equipment Data 2 Support
  - Added setting
  - Added `settings.use_legacy_2` handling to ProjectCard
  - Added `settings.use_legacy_2` handling to QuestDrawer
  - Modified `pqh-updater` to work with new legacy version
  - Updated README.md to have more information about Legacy Equipment Data 2
### Changed
- Changed how recipe version was handled, bugs may or may not have appeared as a result
### Fixed
- Fixed a bug reported by `Aquastic#1522`
  - Completing a project in legacy mode would use current recipe values

## [3.0.3] - 2022-02-18
### Added
- Event Quests
  - Event quests are the ***PERMANENT*** version of the event (no point having data for limited quests...)
  - As a result, some quests for event characters (i.e. Ram from Re:Zero Collab Event) won't be available
  - For some reason, there are some drop rate changes compared to limited and permanent events
    - Most limited and permanent events have memory piece drop rates as `[28, 28, 29, 29, 30]`
    - The Elizabeth Park event (permanent version) (event_id 20024) has their memory piece drop rates as `[54, 54, 54, 54, 54]`
  - Because of the note above, limited versions of event quests won't be served because the permanent version can differ.

## [3.0.2] - 2022-02-16
### Added
- Made some changes based off of `MightyZanark#0138`'s suggestions
  - Swapped transparency of `IGNORED RARITIES (FOR PROJECT COMPLETION)`
    - Rarities that are ignored are now colored in
  - Changed images used in Project Type selection to be ones that aren't cut strangely

## [3.0.1] - 2022-02-14
### Added
- Auto Updater
### Fixed
- Fixed broken images

## [3.0.0] - 2022-02-13
Initial Commit ; `priconne-quest-helper` v3.0 Start!
### Added
- Home Page
  - Project builder (character and item)
  - Project card
    - Required and missing items
    - Character start/end details
    - Project edit
    - Project prioritize
    - Project complete
    - Project delete
  - Quest drawer
    - Quest settings
      - Quest sorting (list and score)
      - Event drop buff (x1, x2, x3, x4)
      - Quest range filter
      - Quest difficulty filter
      - Ignored item rarities
      - Specific item filter
    - Quest details and inventory editing
    - Infinite quest scrolling
- Character Page
  - User character box editing
- Inventory Page
  - User inventory editing
- Settings Page
  - Use legacy mode
  - Reset tip alerts