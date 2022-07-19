// go ahead and do our base setup here
//const { Pool} = require('pg');
const Discord = require("discord.js");
const info = require('./info.js');


//create new pool for postgres connection, the user still needs to be created and ip added to pg_hba.conf on db server
/*
const pool = new Pool({
	user: pg_user,
	database: pg_database,
	password: pg_password,
	port: 5432,
	host: pg_host,
})
*/

//bs place to store this function to convert to a word day of the week
function dayOfWeekAsString(dayIndex) {
	return ["Sunday", "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex] || '';
  }
const upkeepword = dayOfWeekAsString(info.upkeep_day);

// Create a new client instance
const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES"]});

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log(`logged in as ${client.user.tag}`);
});

//we will use this function to check how much time is left till upkeep
function upkeepcheck(day, message) {
	var today = new Date();
	var dayOfWeek = today.getDay();
	var timeLeft = day - dayOfWeek;
	if(timeLeft <= 0) {
		var hoursLeft = info.upkeep_time - today.getHours();
		if(hoursLeft <= 0) {
			timeLeft='7 days';
		}
		else {
			timeLeft=hoursLeft+' hours';
		}
	} else {
		timeLeft=timeLeft+' days';
	}
	message.channel.send(`${timeLeft} left till upkeep`);
}

//a function to handle messages, trim off the first 5 characters of the message and then processes the message
function commands(message) {
	var msg = message.content.substring(5);

	//i will swap this to a switch statement later when i am feeling less lazy, brain says no right now
	if(msg === 'ping') {
		message.channel.send('pong');
	}
	else if(msg === 'help') {
		message.channel.send('ping - ping the bot\nhelp - show this message \n tillupkeep - check how much time is left till upkeep \n upkeep - shows what day/time upkeep is at');
	}
	else if(msg === 'info') {
		message.channel.send('nothing here yet sorry');
	}
	else if(msg === 'tillupkeep') {
		upkeepcheck(info.upkeep_day, message);
	}
	else if(msg === 'upkeep') {
		message.channel.send('upkeep is at '+info.upkeep_time+':00 on '+upkeepword+'s');
	}
}
// when a message is seen, check it for command flag and if it is, run the commands function
client.on('messageCreate', message => {
	if (message.content.startsWith('!cel')) {
		commands(message);
	}
})

// Login to Discord with your client's token
client.login(info.token);
