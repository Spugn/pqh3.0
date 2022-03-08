# Changelog
All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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