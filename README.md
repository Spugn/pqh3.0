![README Banner](https://raw.githubusercontent.com/Expugn/priconne-quest-helper/master/images/webpage/README_Banner.png)

# Princess Connect! Re:Dive Quest Helper<br/>(priconne-quest-helper)

URL: <https://spugn.github.io/priconne-quest-helper/><br/>
Changelog: [/priconne-quest-helper/CHANGELOG.md](CHANGELOG.md)
<br/>

## Information
This is a tool to help you decide which is the best quest to farm to get
whatever assortment of items you need to rank up your characters.

Compared to `expugn/priconne-quest-helper`, this edition of `priconne-quest-helper` hopes to achieve the following:
1. Less confusing and more user-friendly user interface.
2. Support for region exclusive characters not included in the `Japan` version.
3. Automated updating process through the use of GitHub Actions.
4. Use of item and unit IDs instead of fan English translated names.

## Project Goals
**`spugn/priconne-quest-helper` IS CURRENTLY INCOMPLETE AND A WORK-IN-PROGRESS!**<br />
The following list is a task list that will (hopefully) eventually be completed over the course of development.

- [x] User Character Box Editing
- [x] User Inventory Editing
- [x] Projects
- [x] Quest Search
- [x] Quest Settings (Sort, Drop Buff, Quest Range, Item Filter, ETC.)
- [x] Saved User Information
- [x] Automatic Updater
- [x] Data Import and Export (includes importing from `expugn/priconne-quest-helper`, see notes below)
- [x] Recipe Data Page
- [x] Character Data Page
- [x] Quest Data Page
- [x] Statistics Data Page
- [ ] Webpage Multi-Language Support

## Importing Data from `expugn/priconne-quest-helper`
To import your old project and inventory data from `expugn/priconne-quest-helper` (the original version of `priconne-quest-helper`), you may do the following:
1. Get a `data-import` URL with Projects or Inventory selected from <https://expugn.github.io/priconne-quest-helper/pages/export-data>
   - A `data-import` URL should look something like `https://expugn.github.io/priconne-quest-helper/pages/import-data?id=<save_data_id>`
2. Replace `https://expugn.github.io/priconne-quest-helper/pages/import-data` with `https://spugn.github.io/priconne-quest-helper/data-import`, keeping the `?id=<save_data_id>`
   - Your new URL should look something like `https://spugn.github.io/priconne-quest-helper/data-import?id=<save_data_id>`
3. Go to the modified URL, and import your data.
   - `expugn/priconne-quest-helper` projects are converted to `Item Projects`.

## Recommended Procedure On How To Use This Tool
1. Open the tool URL in your phone or PC browser: (<https://spugn.github.io/priconne-quest-helper/>)<br>
If on a mobile phone, horizontal viewing is probably best.
2. Open up `Princess Connect Re:Dive` via your phone or `DMM Game Player`.
3. Create a Character or Item project by selecting "NEW PROJECT" on the home page.
4. Go through the steps to create a new project.
5. Click on the "DISABLED" button on the project card to enable it.
6. Open the quest dialog to view recommended quests and decide for yourself which quest is the most cost efficient for your stamina.
7. Click on any items you have obtained from farming the quest and add them to your inventory.
8. Repeat selecting optimal quests until you complete your enabled projects.
9.  When your projects are complete, they will be marked as "Completed" on their project card.
10. Click on the "`MORE VERT`" icon on the project card to reveal it's menu, select "COMPLETE" to complete the project.

## Bugs, Errors, Feature Suggestions, etc.
The following can be submitted via `GitHub's Issue Tracker` (**PREFERRED**) or `Discord` (`S'pugn#2612`).
1. Bugs found while using the tool.
2. Errors found in the data.
3. Feature Suggestions on how to make using this tool more easier.
4. Comments, Constructive Criticism, etc.

Note that for `Discord`, ***I do not accept random friend requests.*** <br/>
Please join the Discord-partnered server (<https://discord.com/invite/priconne>) to send me (`S'pugn#2612`) a direct message or mention.

## For Developers
### Updating priconne-quest-helper 3.0
If you are interested in how `priconne-quest-helper` is updated for any reason:<br/>
The GitHub Actions workflow and the required code to run it can be found in this repository: <https://github.com/Spugn/priconne-quest-helper/tree/master/.github/workflows>

This is not useful for most users.

## Other Informative Sites and Tools
- `AssetStudio`: [GitHub](https://github.com/Perfare/AssetStudio)
  - Using the `DMM Game Player` version of `Princess Connect! Re:Dive`
      - Game Folder: `C:\Users\%UserName%\AppData\LocalLow\Cygames\PrincessConnectReDive` (Windows 10)
- `expugn/priconne-quest-helper`: [GitHub](https://github.com/Expugn/priconne-quest-helper) | [Website](https://expugn.github.io/priconne-quest-helper/)
- `Hatsune's Notes`: [GitHub](https://github.com/superk589/PrincessGuide)

## Other Stuff
This is a non-profit fan project with the purpose of practice and entertainment.<br/>
All characters and assets belong to their respective owners.

**Project** began on January 3, 2022.<br/>
**Beta-Testing** began on February 13, 2022.<br/>
**Beta v2-Testing** began on December 21, 2022.<br/>