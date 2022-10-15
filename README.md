![README Banner](https://raw.githubusercontent.com/Expugn/priconne-quest-helper/master/images/webpage/README_Banner.png)

# Princess Connect! Re:Dive Quest Helper<br/>(priconne-quest-helper)

URL: <https://spugn.github.io/priconne-quest-helper/><br/>
Changelog: [/priconne-quest-helper/CHANGELOG.md](CHANGELOG.md)
<br/>

<hr>

## DEVELOPMENT UPDATE: October 8, 2022
Hi. It's been a while since a last proper update to this version of `priconne-quest-helper` (last update was 7 months ago, lol).

Reason being that I'm not happy with the current version of the BETA, so I'm scrapping it and starting from scratch and trying to move away from using React. Unfortunately, life got busy (got involved with a number of different projects and different games) and I haven't been able to commit as much time for the new version of BETA. I'll get around to it eventually though, maybe.

Anyways, main reason for this "development update" though is to inform people about the Japanese server's quest data changes to NORMAL quests. The reason this is significant to this project is because as of right now, all regions have been following the Japanese server's quest data. Due to the awkward position of BETA, I will not be adding "Multi-Region Quest Data" support to this version of BETA as that would require maybe a good amount of changes to a version I'm no longer interested in continuing support for.

I am aware that a good amount of English server people use the BETA and I apologize for the inconvience. When developing the never version of BETA I will be sure to include Multi-Region Quest Data support.

*There is currently no estimated time available for when the new BETA will be released.*

***Please use the "stable" version of `priconne quest helper` <https://expugn.github.io/priconne-quest-helper/> if you need "Multi-Region Quest Data" support.***

To preview overall drop rate changes and to compare it with other servers, please visit <https://expugn.github.io/priconne-quest-helper/pages/quest-data/>

For more information regarding the Japanese server's normal drop rate changes: <https://priconne-redive.jp/news/update/19627/>

<hr>

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
- [ ] Data Import and Export
- [ ] Recipe Data Page
- [ ] Character Data Page
- [ ] Quest Data Page
- [ ] Statistics Data Page
- [ ] Multi-Language Support (Webpage, Unit, and Item Names)
- [ ] Image Optimization

## Regarding Current, Legacy, and Legacy_2 Equipment Data
As of `August 31, 2019`, the `Japan` servers for `Princess Connect! Re:Dive` have different costs for equipment.<br>
As of `February 28, 2022`, the `Japan` servers for `Princess Connect! Re:Dive` have updated these costs again.<br>
***Some regions may not have updated to use these new costs.*** If your region still uses the old costs, use `Legacy Equipment Data` or `Legacy Equipment Data 2` instead of `Current Equipment Data`

You can tell if your region uses `Legacy Equipment Data` or `Legacy Equipment Data 2` by going to <https://expugn.github.io/priconne-quest-helper/pages/recipe-data/> and reviewing the recipes of some items.
For example:
- Justice God's Staff <img src="https://raw.githubusercontent.com/Expugn/priconne-quest-helper/master/images/items/Justice_God's_Staff_Fragment.png" alt="Justice God's Staff Fragment" width="48">
  - LEGACY: `30` Fragments Required
  - LEGACY_2: `20` Fragments Required
  - CURRENT: `10` Fragments Required
- Lion Eagle's Feather <img src="https://raw.githubusercontent.com/Expugn/priconne-quest-helper/master/images/items/Lion_Eagle's_Feather_Fragment.png" alt="Lion Eagle's Feather Fragment" width="48">
  - LEGACY: `5` Fragments Required
  - LEGACY_2: `3` Fragments Required
  - CURRENT: `3` Fragments Required

If your region's server uses `Legacy Equipment Data` or `Legacy Equipment Data 2`, you can continue to use the `Legacy Equipment Data` or `Legacy Equipment Data 2` by:
1) Go to the `Settings` page
2) Turn on "`Use Legacy Version`" or "`Use Legacy Version 2`", based on what equipment data your region uses.

The `Recipe Data` and `Statistics` pages also have the ability to use the `Legacy Equipment Data` if desired.

## Recommended Procedure On How To Use This Tool
1. Open the tool URL in your phone or PC browser: (<https://spugn.github.io/priconne-quest-helper/>)<br>
If on a mobile phone, horizontal viewing is probably best.
2. Open up `Princess Connect Re:Dive` via your phone or `DMM Game Player`.
3. Create a Character or Item project by selecting "NEW PROJECT" on the home page.
4. Go through the steps to create a new project.
5. Click on the "DISABLED" button on the project card to enable it.
6. Open the quest drawer to view recommended quests and decide for yourself which quest is the most cost efficient for your stamina.
7. Click on the "OPEN IN FULL" icon on the quest you want to farm.
8. Click on any items you have obtained from farming the quest and add them to your inventory.
9. Repeat selecting optimal quests until you complete your enabled projects.
10. When your projects are complete, they will be marked as "Completed" on their project card.
11. Click on the "MORE VERT" icon on the project card to reveal it's menu, select "COMPLETE" to complete the project.

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
