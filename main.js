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
	return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] || '';
}
const upkeepword = dayOfWeekAsString(info.upkeep_day);

// Create a new client instance
const client = new Discord.Client({
	intents: ["GUILDS", "GUILD_MESSAGES"]
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
	process.stdout.write(`logged in as ${client.user.tag} \n`);
});

//see how many hours till the next upkeep_time on upkeep_day and return it in dd hh mm ss format, this is kinda dumb, but it works for now fully
function hoursTillUpkeep(message) {
	const now = new Date();
	const nextUpkeep = new Date(now.getFullYear(), now.getMonth(), now.getDate(), info.upkeep_time, 0, 0);
	const diff = nextUpkeep - now;
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((diff % (1000 * 60)) / 1000);
	let outdays = 7 + days;
	let outhours = 24 + hours;
	let outminutes = 60 + minutes;
	let outseconds = 60 + seconds;
	//change all of the out variables to be two digits.
	let time_array = [outdays, outhours, outminutes, outseconds];
	time_array.forEach(element => {
		let i = 0
		if (element < 10) {
			time_array[i] = '0' + element;
		}
		i++;
	})
	//send the message */
	message.channel.send(`Time till upkeep: ${time_array[0]}d ${time_array[1]}h ${time_array[2]}m ${time_array[3]}s`);
}

//a function to find out what date next upkeep is, i still couldnt figure out how to do this better so i just used seconds since epoch here and then converted it to a date, will probably do the same for the other eventually
var upkeep = (message) => {
	var curr_date = new Date();
	var day_info = 8.64e+7;
	var days_to_upkeep = (7 + info.upkeep_day) - curr_date.getDay();
	var upkeep_in_sec = curr_date.getTime() + days_to_upkeep * day_info;
	var next_upkeep = new Date(upkeep_in_sec);
	next_upkeep.setHours(0, 0, 0);
	//process.stdout.write(next_upkeep.toDateString()+'\n'); //just a test to see if the date is correct (it is)
	message.channel.send(`next upkeep is on ${next_upkeep.toDateString()} at ${info.upkeep_time}:00`);

}


//a function to handle messages, trim off the first 5 characters of the message and then processes the message
function commands(message) {
	var msg = message.content.substring(5);
	//i will swap this to a switch statement later when i am feeling less lazy, brain says no right now
	if (msg === 'ping') {
		message.channel.send('pong');
	} else if (msg === 'help') {
		message.channel.send('ping - ping the bot\nhelp - show this message \n tillupkeep - check how much time is left till upkeep \n upkeep - shows when the next upkeep is at');
	} else if (msg === 'info') {
		message.channel.send('nothing here yet sorry');
	} else if (msg === 'upkeep') {
		upkeep(message);
	} else if (msg === 'tillupkeep') {
		hoursTillUpkeep(message);
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