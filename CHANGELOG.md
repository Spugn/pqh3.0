# Changelog
All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.6] - 2024-04-15
### Fixed
- Fixed image extractor, hash for image asset is now the 2nd one

## [3.2.5] - 2024-04-13
### Removed
- Reverted Reverted Obfuscated JP database support v2
  - They are using the new table/column names again, April Fools I guess

## [3.2.4] - 2024-04-06
### Removed
- Reverted Obfuscated JP database support v2
  - They are no longer using the new table/column names, April Fools I guess

## [3.2.3] - 2024-04-01
### Added
- Obfuscated JP database support v2
  - Updated updater script to work with JP `10065610`, this may break again in the future
  - Older versions of the JP database (`10065600` and below) are no longer supported

## [3.2.2] - 2024-03-18
### Fixed
- Fixed issue with priority amounts in quest list inventory editor
- Fixed issue where rarity 10 items could not be seen in "Inventory Page - Alternate Mode" due to outdated rarity ID logic

## [3.2.1] - 2024-03-08
### Addded
- Obfuscated TW database support
  - TW server has adopted the same obfuscation as JP database, this may break again in the future
  - Older versions of the TW database below `00190002` are no longer supported

## [3.2.0] - 2024-03-05
### Added
- Obfuscated database support
  - Updated updater script to work with the obfuscated JP database, this may break again in the future.
  - Older versions of the JP database below `10053000` are no longer supported
- Added placeholder image for pink rarity: `items/9910999.png`

## [3.1.12.1] - 2024-01-15
Hiatus Announcement - Possibly Permanent
### Notice
- As of JP version `10053000`, every table and column name in the SQL database is obfuscated
  - This breaks all the updating related tools I've written to maintain this project
- Unfortunately, I don't have the time anymore to commit trying to crack how to decode everything myself
  - I've also quit playing the game quite some time ago, and am no longer passionate about it
- If there's no clear easy solution to work around the new database changes, I'll retire from this project
  - Webpage activity has been generally small, and late-game generally doesn't need any quest helper anymore
  - This also includes `expugn/priconne-quest-helper`
- I'll be watching for possible solutions around this issue, but I won't be working on it myself
- The following projects will possibly continue to be maintained in the meantime, although the new table changes make any database generally unreadable:
  - `priconne-database` <https://github.com/Expugn/priconne-database>
  - `priconne-diff` <https://github.com/Expugn/priconne-diff>

## [3.1.12] - 2023-06-29
### Changed
- Increased bottom margin size for character and item projects to hopefully prevent cut-off
  - <https://github.com/Expugn/priconne-quest-helper/issues/48>

## [3.1.11] - 2023-06-03
### Added
- Thai Region Support
  - Added support for the Thai region of the game (characters/equipment/quest data).

## [3.1.10] - 2023-05-15
### Added
- Added support for "subdrops 2"
  - Chapter 64 introduced a new quest mechanic where you can get 1 type of accessory every quest
    - As of this writing: `50% Red` ; `25% Blue` ; `25% Green`
  - Updated Quest Simulator to make it properly work with `subdrops_2`
  - Updated `quests` page to display `subdrops_2`
  - Updated quest list to display `subdrops_2`
### Changed
- Improved character and item search a little
  - Romanji to Kana search isn't as strict now
    - OLD: Searching for "`miy`" returns `[Miyako, Miyako (Halloween)]`
    - NEW: Searching for "`miy`" returns `[Miyako, Miyako (Halloween), Miyako (Christmas)]`
    - Basically, you don't need to type "`miya`" to get `Miyako (Christmas)` now
- Updated README.md
- Changed some styling for some pages

## [3.1.9] - 2023-04-16
End Beta v2, I guess.
### Added
- The ability to eat pies (yummy)
  - aka, an alternate way to extract images due to the recent Unity update breaking everything
  - pie == priconne-image-extractor, if that wasn't obvious
### Removed
- Removed the "(BETA v2)" text from title.
  - Site looks pretty stable so far I think, or I havent gotten any complaints in months so I'll just remove the BETA deal.
- Python Dependency
- UnityPack
  - Due to `priconne-jp`'s recent Unity update, this library no longer works to extract assets.
- Image extraction from `.github/workflows/pqh-updater`

## [3.1.8] - 2023-02-15
### Added
- Added placeholder image for skyblue rarity: `items/999999.png`
### Changed
- Changed previous `999999.png` to `unknown.png` due to the latest skyblue rarity
- Update updater script to use `unknown` instead of `999999`
- Changed any reference to `999999` to use `unknown` instead

## [3.1.7] - 2023-01-08
### Added
- "All Projects" display in Bulk Create Projects
  - Suggested by `Wazhai#0161`
  - Displays the combination of all required project items, initially selected by default
- Display "Required Fragments" in Bulk Create Projects
  - Suggested by `Wazhai#0161`
  - Required Fragments will be calculated and displayed instead of just Required Items.
- Quest Simulator Changes
  - Suggested by `Wazhai#0161`
  - Improved calculation, it now takes a lot less time (original method available as "precise" mode)
  - Quest Settings now effect quest simulator
- Quest Simulator - Stamina Overlay
  - Suggested by `Wazhai#0161`
  - New setting; if enabled, quest simulator will auto-run and display consumed stamina on top right of page.
  - Overlay can be clicked to display usual simulator results (quests ran, item drops obtained, etc)
  - Added "Don't Use Inventory" setting for moments where you don't want to include an existing inventory
  - Results from Stamina Overlay are calculated via Imprecise Mode. Precise Mode is unavailable while using Stamina Overlay.
  - "Simulator" button will be hidden if this is enabled due to it being unnecessary
- Session Ignored Rarities are now saved and carry over between sessions
  - Suggested by `Wazhai#0161`
- Project List Sorting
  - Suggested by `Tomo#5563`
  - Project list can now be sorted by date, priority, unit ID, project type, and enabled status
  - Sort settings will persist between sessions
- Added button to access project menu while project is expanded
  - Suggested by `Wazhai#0161`
  - Project will un-expand if this is used
    - Why? Because due to how project cards are designed and displayed, it will cause issues after a project is edited,
      completed, deleted, etc.
    - Specifically, when a project is completed/deleted in an expanded state there's little to no time to unexpand the
      project without some funky stuff going on with reactivity. I'm sure there's a billion workarounds but it doesn't
      feel worth my time to figure one out at the moment
- [All Projects...] Project
  - New Setting ; if enabled, an [All Projects...] project will be created that contains the items of all projects as
    long as there is two or more projects and at least one required item.
  - The [All Projects...] project can NOT be edited like a normal project (no partial completion, no deletion, no editing, etc)
  - The [All Projects...] project can NOT be enabled like a normal project.
  - Inventory editing will be available like usual by clicking any "Required Fragment" or "Missing Fragment"
  - Added "Display [All Projects...] Project First" setting
    - By default, the [All Projects...] project will be influenced by sort options
    - If you would prefer the [All Projects...] project to appear first in list and ignore any sort option,
      enable this setting
  - Added "[All Projects...] Project Ignored Rarities" setting
    - Modify this to change ignored rarities for the [All Projects...] project
### Changed
- Changed some styling in QuestSettings to make it somewhate better for smaller width devices
- The Quest Simulator dialog can now be closed via clicking on the black area or pressing ESC when stamina overlay is
  enabled

## [3.1.6] - 2023-01-01
Happy New Year! 2023
### Added
- Bulk Create Projects
  - Suggested by `Wazhai#0161`
  - Original idea from `pcredivewiki.tw`'s armory feature
  - Create multiple projects of your **owned** characters with the same end target.
  - Character's rank must be less than or equal to the target rank to be selectable for project creation
  - Required items can be viewed before being added to project list, in case you want a non-destructive way of viewing
    a project's required items but not interested adding it
- (Bulk) Partially Complete Project
  - Suggested by `Wazhai#0161`
  - Although a "Partial Complete" feature technically already exists (expand project and click any required item), this
    version includes moving the start of a project forward and saving the new start as the current character state
  - This version also includes consuming inventory, but that was already a part of the other version so whatever
  - This is for CHARACTER PROJECTS only. Item projects must continue using the manual one-at-a-time "Partial Complete"
  - Bugs may exist, this was written pretty poorly lol
### Fixed
- Fixed some issues with Quest Simulator
  - Fixed incorrect label for "Very Hard"'s select
  - Removed the required items check because the "use inventory" feature exists
    - People can now select completed projects and run the simulator if `Use Inventory?` is unchecked
  - The "Start" button is now properly disabled if required items don't exist
  - Changed some text
  - Added a note to inform people to click WAIT if the "Page Unresponsive" error appears
    - Page Unresponsive error will appear if there are a lot of required items
- Fixed a bug where project priority level was not kept after editing a project
- Fixed a bug where the priority edit dialog wouldn't close if ENTER was pressed

## [3.1.5] - 2022-12-31
### Added
- Added some countermeasures to autofocusing the project name input for some devices
  - Suggested by `Wazhai#0161`: <https://github.com/Spugn/priconne-quest-helper/issues/6>
  - As of this writing, it is unsure if this addition works as there is no way of validating
- Quest Simulator
  - Kinda suggested by `Wazhai#0161` (suggested a basic stamina estimation)
  - The quest simulator will take all enabled projects and run through every generated quest and display the amount of
    stamina used, amount of quests completed, and all drops obtained
  - This is so the user can get an idea of how much stamina they'll need to complete whatever enabled project
  - The amount of time needed to naturally regenerate the stamina will be calculated, but this is a bit inaccurate as
    there are plenty of ways to get stamina (guild house furniture, 200/400 from daily missions, refills, gifts, etc)
    that aren't accounted for. Consider this maybe as a "max amount of time"

## [3.1.4] - 2022-12-29
### Added
- Improved Character and Equipment Search
  - Suggested by `Wazhai#0161`
    - <https://github.com/Spugn/priconne-quest-helper/issues/1>
    - <https://github.com/Spugn/priconne-quest-helper/issues/2>
  - Added support for "Hiragana to Katakana" search queries
    - "`みやこ`" => `[Miyako, Miyako (Halloween), ...]`
    - "`ゆ`" => `[Yui, Yuki, Yukari, ...]`
    - "`あいあん`" => `[Iron Blade]`
  - Added support for "Romaji to Kana" search queries
    - "`kyaru`" => `[Karyl, Karyl (Summer), ...]`
      - "`Karyl`" doesn't return the latest thematics of "`Kyaru`", guess `Kyaru` is better than `Karyl`
    - "`kurisumasu`" (christmas) => `[Chika (Christmas), Nozomi (Christmas), Christina (Christmas), ...]`
    - "`aian`" => "`[Iron Blade]`"
- Inventory Page sort options now persist for the session
  - Previously, sorting in Inventory Page and then switching to Character/Settings/etc would reset sort options
  - Search options will now persist for the session (lost when the webpage is refreshed)
- Added fragment and rarity sort options and rarity filter for "Inventory Page - Alternative Mode"
  - Suggested by `Wazhai#0161`: <https://github.com/Spugn/priconne-quest-helper/issues/3>
- Changed "Start Rank" and "End Rank" inputs to be `onchange` rather than "on value change"
  - Suggested by `Wazhai#0161`: <https://github.com/Spugn/priconne-quest-helper/issues/4>
  - This change will make it possible to backspace below minimum rank
  - This change will also makes it so that equipment items no longer load as the user types
    - Un-focus the input or press the `ENTER` key to get items to load
### Fixed
- Fixed an issue with the import URL causing issues on smaller width devices/displays
  - Reported by `Wazhai#0161`: <https://github.com/Spugn/priconne-quest-helper/issues/5>

## [3.1.3] - 2022-12-25
### Added
- Search option for "Inventory Page - Alternative Mode"
### Changed
- Minor styling changes for the "Back to character list" and "Back to item list" links

## [3.1.2] - 2022-12-24
### Added
- Compact Project Cards
  - Suggested by `Tomo#5563`
  - Reduce the size of project cards so that more can be displayed at once on wide screens with this setting enabled.
- Keep Enabled Projects
  - Suggested by `Tomo#5563`
  - Enabled projects will persist between sessions with this setting enabled.
### Changed
- Changed `open_in_full` icon in Quest List's Quest ID button to be light gray color instead of gold

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