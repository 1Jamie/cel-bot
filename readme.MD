# cel-bot
Discord bot being built by the Cellar door gang in CCO for general gang/guild tools and commands built with node, discordjs and postgres

please note that this is a work in progress, this will be filled out more over time as features are developed and planned

## usage
1. install package as standard node app
2. modify info.js.example with token for your bot account and fill in guild/gang realted info such as upkeep_time and upkeep_day. This should be input in 24hr format and day in number format eg monday=1 tuesday=2, do not put this in quotes as it will treat it as a string instead of an int and will return the wrong time
3. run main.js

### current commands
* !cel help:   shows help output
* !cel upkeep:  shows what time and what day upkeep is
* !cel tillupkeep:  shows how much time is left till upkeep
* !ping : replies with pong (for verifying connection)
