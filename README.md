![README Banner](https://raw.githubusercontent.com/Expugn/priconne-quest-helper/master/images/webpage/README_Banner.png)

# Princess Connect! Re:Dive Quest Helper<br/>(priconne-quest-helper)

URL: <https://spugn.github.io/priconne-quest-helper/><br/><br/>
Character Data: <https://spugn.github.io/priconne-quest-helper/characters><br/>
Item Data: <https://spugn.github.io/priconne-quest-helper/items><br/>
Quest Data: <https://spugn.github.io/priconne-quest-helper/quests><br/>
Statistics: <https://spugn.github.io/priconne-quest-helper/statistics><br/>
Changelog: [/priconne-quest-helper/CHANGELOG.md](CHANGELOG.md)<br/>

## End of Service Announcement

As of Japan database version `10057700` (hash `82fc98bec64b0327`), it seems Cygames added another layer of obfuscation.

Before, it was managable because even though the table and column names were obfuscated, the order of things stayed the same and you could piece together the info as long as you knew what it used to be before.<br>
However, now it seems they've developed a way to shuffle the column order which makes it practically impossible to figure it out now.

For example, some data from the Japan database version `10052900` would look similar to:
```json
{
   "enemy_reward_data": [
      {
         "drop_reward_id": 11001011,
         "drop_count": 1,
         "reward_type_1": 4,
         "reward_id_1": 101011,
         "reward_num_1": 1,
         "odds_1": 54,
         "reward_type_2": 0,
         "reward_id_2": 0,
         "reward_num_2": 0,
         "odds_2": 46
      }
   ]
}
```
As of `10053000`, the table and column names became obfuscated, so that same piece of data now looks like:
```json
{
   "v1_002b61c4e8da5d368b8e3ce110cee277bc3bd0ba44745e67c30574cdebb9bd60": [
      {
         "f05d2c56cf858e5ecd0e4411a34abc8dbd9d4234864304021ef43adc5ab8c48a": 11001011,
         "af908dfb77e40ce2bcee817d928d56b9af99f4507f139512529f654487b41441": 1,
         "3406a7b5c966b47549cc816bfbe2d6d5ddf2de3721a2b55762ac26d249f50037": 4,
         "430b2c1ab094580fc896801738de9343f82876f00c899c320603331a68472522": 101011,
         "ffc200730b201a3e8f248d9cc8e3be6f2fcdabab7ad64adb372c83a80176bd43": 1,
         "83f24dcde59e2043aeeef0ab1aba24550573a74f8a7e95df24453b31ce9dbc96": 54,
         "3f011d75f4d37b31c60f7cb55653124b81533babb92e84ac8dc003c0e6550dc1": 0,
         "4e6cdefe4a0954e8fca9144915da283ba14bc25c7140615a09fb0f1a53de3c75": 0,
         "2c2f43260c23dfe18097e2e6b8c72c5ffce9f5f653e8a389c632fc0a00e17659": 0,
         "11d035f1151460d3163c2a839e34593efb3f5c1291797556a73ff63ee3fa92a5": 46
      }
   ]
}
```
As of `August 15, 2024`, database version `10057700` has been obfuscated further to become something like:
```json
{
   "v1_a0167d5e775b9ab82d7df1e4c4cae5eeb8c5ed68a681c0cc16f68928fee7f178": [
      {
         "17f18f10f4f4d72010189759828a9347abac5171f910880f4ddbd49b69501dbf": 0,
         "3406a7b5c966b47549cc816bfbe2d6d5ddf2de3721a2b55762ac26d249f50037": 4,
         "02efe556d9bef58fbfb8ca142019993547c40f18b7bb12628b40ea344ba12b58": 0,
         "64fb5726d4748ab9d2947aa90ba496ba66ee84947299cabdb07eb29ad3f91e18": 101011,
         "83f24dcde59e2043aeeef0ab1aba24550573a74f8a7e95df24453b31ce9dbc96": 54,
         "f0c451b52029fd9d887760ce4be686f198daa66915452d830df31936d9f3e8b5": 46,
         "59216ed8792e0dc02888d2e7b8eb7f8aea10e72cae7769d516e66608d0e8e38b": 1,
         "751ae55df274d6a866cada5388525f3c3c3c4ee48e8fa32d62f14cbd1e64c5c1": 11001011,
         "2dadd4c52de71bbd8ca733aa3d16e41b46cfdb72f3c5e0c52ef78f2fc9bc4a36": 1,
         "ccd9db62a517f477830284499bc68fe70781a0c5882975653d4e8ac594c3fd34": 0
      }
   ]
}
```
Switching the order like this makes it become incredibly difficult because now I can no longer figure out which value means what, like if I wanted to look up the value for `reward_id_2`, exactly which `0` is that value?

Even if I spend time figuring everything out, Cygames can possibly very easy shuffle everything again, forcing me to start from scratch. They're not exactly scared to do that either, because in the early stages of the initial obfuscation they changed the obfuscated table and column names practically monthly.

As a result, I've decided I'm not longer fighting this losing battle. I've quit `Princess Connect Re:Dive!` practically years ago so I'm not invested in the game at all anymore. I've just kept maintaining this tool because I saw that people kept using it and it was somewhat easy to maintain.

In any case, it's been about 5.5 years (`January 10, 2019`) since I started working on the inital version of `priconne-quest-helper` (<https://github.com/Expugn/priconne-quest-helper>). I've learned a lot thanks to this project because it gave me an excuse to dive into looking at various languages and technologies I wouldn't have bothered to look into otherwise. I can't recommend starting a project similar to `priconne-quest-helper` to anyone aspiring to learn or become a better programmer.

Cheers to all the people I've met and was able to talk to during my development journey on this project. Thanks to all who gave suggestions via Discord or GitHub, I would have never thought of them and they definitely improved the experience overall. Thank you to all the people who donated to my Ko-Fi, I didn't push for donations and would have kept maintaining the tool even if I got nothing, but those donations did motivate me a bit to keep going for as long as I did.

***Thank you all very much for following the development of `priconne-quest-helper`.***<br>
It's been an absolute pleasure being able to serve this resource to you all.

## Information
This is a tool to help you decide which is the best quest to farm to get
whatever assortment of items you need to rank up your characters.

Compared to `expugn/priconne-quest-helper`, this edition of `priconne-quest-helper` hopes to achieve the following:
1. Less confusing and more user-friendly user interface.
2. Support for region exclusive characters not included in the `Japan` version.
3. Automated updating process through the use of GitHub Actions.
4. Use of item and unit IDs instead of fan English translated names.

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

## Project Goals
`spugn/priconne-quest-helper` is currently marked as complete for now due to lack of usage. Any further development
will be bug fixes or from suggestions due to increased traffic.<br />

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
- [ ] ~~Webpage Multi-Language Support~~ Cancelled

## Bugs, Errors, Feature Suggestions, etc.
The following can be submitted via `GitHub's Issue Tracker` (**PREFERRED**) or `Discord` (`@spugn`).
1. Bugs found while using the tool.
2. Errors found in the data.
3. Feature Suggestions on how to make using this tool more easier.
4. Comments, Constructive Criticism, etc.

Note that for `Discord`, ***I do not accept random friend requests.*** <br/>
Please join the Discord-partnered server (<https://discord.com/invite/priconne>) to send me (`@spugn`) a direct message or mention.

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
**"Complete" Release** began on April 16, 2023.<br/>
**End of Service** began on August 15, 2024.<br/>