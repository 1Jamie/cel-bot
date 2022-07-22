// go ahead and do our base setup here
const {
	Pool
} = require('pg');
const Discord = require("discord.js");
const info = require('./info.js');


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
	console.log(message.content);
	var words = message.content.split(" ");
	words.shift();
	words.shift();
	console.log(words);
	//switch for handling create and edit commands
	switch (words[0]) {
		case "create":
			console.log('using create with values: ' + words[1] + ' ' + words[2] + ' ' + words[3]);
			//check if the user is a moderator, that there are enogh inputs and they are the correct type of input itemname(sting) aiValue(number) btcValue(number)
			//console.log(checkmod(message), words.length == 4, typeof words[1] == "string", !isNaN(words[2]), !isNaN(words[3]))
			if (checkmod(message) && words.length == 4 && typeof words[1] == "string" && !isNaN(words[2]) && !isNaN(words[3])) {
				//check if the item already exists in the database and order them by item id descending
				pool.query("SELECT * FROM market WHERE itemname = $1 ORDER BY id desc", [words[1]], (err, res) => {
					if (err) {
						console.log(err)
					} else {
						//if the item does not exist, insert it into the database and send a message to the channel saying it was created
						if (res.rows.length == 0) {
							console.log('creating new item in market with itemname: ' + words[1]);
							pool.query("INSERT INTO market (itemname, aivalue, btcvalue, updatedby, server, updatedon) VALUES ($1, $2, $3, $4, $5, $6)", [words[1], words[2], words[3], message.author.username, message.guild.name, new Date()], (err, res) => {
								if (err) {
									console.log(err)
									message.channel.send("Error creating item, please try again after checking your inputs, and if the problem persists, contact a moderator")
								} else {
									message.channel.send("Item created successfully with name: " + words[1] + " and ai value: " + words[2] + " and btc value: " + words[3]);
								}
							})
						} else {
							//if the item already exists tell the user to update it instead and tell them what we have in the database
							message.channel.send("Item already exists, please use the update command to update the item instead, the item currently in the database is: " + res.rows[0].itemname + " with a value of " + res.rows[0].aivalue + " AI and " + res.rows[0].btcvalue + " BTC")
						}
					}
				})
			} else {
				if (checkmod == false) {
					message.channel.send("You do not have permission to use this command")
				}
				if (words.length != 4) {
					message.channel.send("Please use the following format: !market create itemname aiValue btcValue")
				}
			}
			break;
		case "update":
			//check if the user is a moderator, that there are enogh inputs and they are the correct type of input itemname(sting) aiValue(number) btcValue(number)
			if (checkmod(message) && words.length == 4 && typeof words[1] == "string" && !isNaN(words[2]) && !isNaN(words[3])) {
				//check if the item exists in the database and order them by item id descending
				console.log('adding new value to item: ' + words[1] + ' with ai value: ' + words[2] + ' and btc value: ' + words[3] + ' by ' + message.author.username);
				pool.query("SELECT * FROM market WHERE itemname = $1 ORDER BY id desc", [words[1]], (err, res) => {
					if (err) {
						console.log(err)
					} else {
						//if the item exists, update it in the database
						if (res.rows.length != 0) {
							pool.query("UPDATE market SET aivalue = $1, btcvalue = $2, updatedby = $3, updatedon = $4 WHERE itemname = $5", [words[2], words[3], message.author.username, new Date(), words[1]], (err, res) => {
								if (err) {
									console.log(err)
									message.channel.send("Error updating item, please try again after checking your inputs, and if the problem persists, contact a moderator")
								} else {
									message.channel.send("Item updated successfully")
								}
							})
						} else {
							//if the item does not exist tell the user to create it instead
							message.channel.send("Item does not exist, please use the create command to create the item instead")
						}
					}
				})
			} else {
				if (checkmod == false) {
					message.channel.send("You do not have permission to use this command")
				}
				if (words.length != 4) {
					message.channel.send("Please use the following format: !market update itemname aiValue btcValue")
				}
			}
			break;
		case "delete":
			//do nothing for now
			break;
		case "list":
			//check if there are any items in the database with that name and order them by item id descending
			console.log('running a list on the market with itemname: ' + words[1]);	
				pool.query("SELECT * FROM market WHERE itemname = $1 ORDER BY id desc", [words[1]], (err, res) => {
				if (err) {
					console.log(err)
				} else {
					//if there are items with that name, tell the user what the first entry is
					if (res.rows.length != 0) {
						message.channel.send("**Item information:**\n __Item Name__:    " + res.rows[0].itemname + "\n__AI trade value__:    " + res.rows[0].aivalue + " AI \n__BTC Market Value__:    " + res.rows[0].btcvalue + " BTC\n__Last updated by__:    " + res.rows[0].updatedby + "\n__Updated On__:    " + res.rows[0].updatedon)
					} else {
						//if there are no items with that name, tell the user there are no items with that name
						message.channel.send("There are no items with that name in the database")
					}
				}
			})
			break;
		case "help":
			//tell the user how to use the commands
			message.channel.send("To create an item, use the following format: !cel market create itemname aiValue btcValue\nTo update an item, use the following format: !cel market update itemname aiValue btcValue\nTo delete an item, use the following format: !cel market delete itemname\nTo list all items with that name, use the following format: !cel market list itemname")
			break;
	}
}



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
	let msg = message.content.substring(5);
	let words = msg.split(" ");
	msg = words[0];
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
	} else if (msg === 'market') {
		market(message);
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