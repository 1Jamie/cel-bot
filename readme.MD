# cel-bot
Discord bot being built by the Cellar door gang in CCO for general gang/guild tools and commands built with node, discordjs and postgres. Currently has support for basic market management but only manual entry, will look into automating it at a later date.

please note that this is a work in progress, this will be filled out more over time as features are developed and planned

## usage
1. install package as standard node app
2. modify info.js.example with token for your bot account and fill in guild/gang realted info such as upkeep_time and upkeep_day. This should be input in 24hr format and day in number format eg monday=1 tuesday=2, do not put this in quotes as it will treat it as a string instead of an int and will return the wrong time
3. run main.js
4. access over discord after inviting your bot to your server to run commands

(need to add empty database dump with schema and steps for setting up the database with the added sql)

### current commands
* !cel help:   shows help output
* !cel upkeep:  shows what time and what day upkeep is
* !cel tillupkeep:  shows how much time is left till upkeep
* !cel ping : replies with pong (for verifying connection)
* !cel market
    * To create an item listing:            `!cel market create itemname aiValue btcValue`
    * To update an item:                    `!cel market update itemname aiValue btcValue`
    * To delete an item:                    `!cel market delete itemname (currently not implemented)`
    * To list all items with that name:     `!cel market list itemname`
    * To search Items:                      `!cel market search item` 
    [^note]: btcvalue and aivalue must be an integer
    [^note]: itemname must be a string with no spaces and no special characters 
    [^note]: to use create or update you must be a mod on the server