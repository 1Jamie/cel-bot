# cel-bot
Discord bot being built by the Cellar door gang in CCO for general gang/guild tools and commands built with node, discordjs and postgres

please note that this is a work in progress, this will be filled out more over time as features are developed and planned

## usage
-install package as standard node app
-modify info.js.example with token for your bot account and fill in guild realted info such as upkeep_time and upkeep_day which should be input in 24hr format and day in number format eg monday=1 tuesday=2
-run main.js

### current commands
!cel help:   shows help output
!cel upkeep:  shows what time and what day upkeep is
!cel tillupkeep:  shows how much time is left till upkeep
!ping : replies with pong (for verifying connection)