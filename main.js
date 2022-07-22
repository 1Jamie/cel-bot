// go ahead and do our base setup here
const {
	Pool
} = require('pg');
const Discord = require("discord.js");
const info = require('./info.js');
const marketmanager = require('./marketmanager.js');
//create new pool for postgres connection, the user still needs to be created and ip added to pg_hba.conf on db server
const pool = new Pool({
	user: info.pg_user,
	database: info.pg_database,
	password: info.pg_pass,
	port: 5432,
	host: info.pg_host,
})
//connect to postgres pool and return results to stdout
pool.connect((err, client, done) => {
	if (err) {
		console.error('error fetching client from pool', err)
		return
	} else {
		console.log('connected to postgres pool')
	}
	done()
})

//function to check permissions, takes in a message and a role name and returns true if the message author has the role
function checkrole(message, role) {
	if (message.member.roles.cache.find(r => r.name === role)) {
		return true;
	} else {
		return false;
	}
}
//function to check if the person is a moderator, takes in a message and returns true if the message author is a moderator
function checkmod(message) {
	//check if the messages author permissions contain manage messages
	console.log(message.member.permissions.has("MANAGE_MESSAGES"));
	if (message.member.permissions.has("MANAGE_MESSAGES")) {
		return true;
	} else {
		return false;
	}
}

//for managing market data and prices
function market(message) {
	//split the message into an array of words and remove the first word (the command)
	var words = message.content.split(" ");
	words.shift();
	words.shift();
	console.log(words);
	//switch for handling create and edit commands, we are gonna just pass each one with the pool and the message so we can use it in the marketmanager.js file
	switch (words[0]) {
		case "create":
			console.log('using create with values: ' + words[1] + ' ' + words[2] + ' ' + words[3]);
			marketmanager.createItem(message, words, pool)
			break;
		case "update":
			console.log('update command seen');
			marketmanager.updateItem(message, words, pool)
			break;
		case "delete":
			//do nothing for now
			break;
		case "list":
			//check if there are any items in the database with that name and order them by item id descending
			console.log('running a list on the market with itemname: ' + words[1]);
			marketmanager.listItem(message, words, pool);
			break;
		case "help":
			//tell the user how to use the commands
			message.channel.send("**To create an item listing**:    !cel market create itemname aiValue btcValue\n**To update an item**:    !cel market update itemname aiValue btcValue\n**To delete an item**:    !cel market delete itemname (currently not implemented)\n**To list all items with that name**:    !cel market list itemname\n**To search Items**:    !cel market search item \n* *btcvalue and aivalue must be an integer*\n* *itemname must be a string with no spaces and no special characters* \n* *to use create or update you must be a mod on the server*");
			break;
		case "search":
			//search for items with that name
			console.log('searching for items with name like: ' + words[1]);
			marketmanager.searchItem(message, words, pool);
			break;
	}
}

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


//a function to handle messages, trim off the command trigger of the message and then processes the message
function commands(message) {
	let msg = message.content.substring(9);
	let words = msg.split(" ");
	msg = words[0];
	//switch to handle the commands
	switch (msg) {
		case "help":
			message.channel.send('ping - ping the bot\nhelp - show this message \n tillupkeep - check how much time is left till upkeep \n upkeep - shows when the next upkeep is at\n market - access market subcommands \n market create - create an item\n market update - update an item\n market delete - delete an item (currently not implemented) \n market list - list all items with that name \n market search - search for items with the given string in the name \n market help - show how to use the market commands');
			break;
		case "ping":
			message.channel.send('pong');
			break;
		case "tillupkeep":
			hoursTillUpkeep(message);
			break;
		case "upkeep":
			upkeep(message);
			break;
		case "market":
			market(message);
			break;
		case "info":
			message.channel.send('this is a bot created by @lady_gaia for the cellar door gang from the game CCO to use, it is currently in beta, so use at your own risk\n if you have any questions or suggestions, please contact @lady_gaia#0001 or open an issue on the repo at https://github.com/1jamie/cel-bot/issues');
			break;
	}
}

// when a message is seen, check it for command flag and if it is, run the commands function
client.on('messageCreate', message => {
	if (message.content.startsWith('!celtest')) {
		commands(message);
	}
})

// Login to Discord with your client's token
client.login(info.token);