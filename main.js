// Require the necessary discord.js classes
const Discord = require("discord.js");
const { Pool} = require('pg')
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

// Create a new client instance
const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES"]});

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log(`logged in as ${client.user.tag}`);
});

//a function to handle messages, trim off the first 5 characters of the message and then processes the message
function commands(message) {
	var msg = message.content.substring(5);
	if(msg === 'ping') {
		message.channel.send('pong');
	}
	else if(msg === 'help') {
		message.channel.send('ping - ping the bot\nhelp - show this message');
	}
	else if(msg === 'info') {
		message.channel.send('nothing here yet sorry');
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
