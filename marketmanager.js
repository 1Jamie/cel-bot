//add in the postgres stuff and discord stuff since we need it for market managment, can probably remove this from the main.js if we are not using it there
const Discord = require("discord.js");
//function to check mod status, takes in a message and returns true if the message author is a moderator
function checkmod(message) {
    console.log(message.member.permissions.has("MANAGE_MESSAGES"));
    if (message.member.permissions.has("MANAGE_MESSAGES")) {
        return true;
    } else {
        return false;
    }
}

//function to create a new item, takes in a message and the item name, btc price, and ai price in array form
function createItem(message, words, pool) {
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
}

function updateEntry(message, words, pool) {
    //check if the user is a moderator, that there are enogh inputs and they are the correct type of input itemname(sting) aiValue(number) btcValue(number)
    if (checkmod(message) && words.length == 4 && typeof words[1] == "string" && !isNaN(words[2]) && !isNaN(words[3])) {
        //check if the item exists in the database and order them by item id descending
        console.log('adding new value to item: ' + words[1] + ' with ai value: ' + words[2] + ' and btc value: ' + words[3] + ' by ' + message.author.username);
        pool.query("SELECT * FROM market WHERE itemname = $1 ORDER BY id desc", [words[1]], (err, res) => {
            if (err) {
                console.log(err)
            } else {
                //if the item exists, add a new row to the database with the new values and send a message to the channel saying it was updated
                if (res.rows.length != 0) {
                    pool.query("INSERT INTO market (itemname, aivalue, btcvalue, updatedby, server, updatedon) VALUES ($1, $2, $3, $4, $5, $6)", [words[1], words[2], words[3], message.author.username, message.guild.name, new Date()], (err, res) => {
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
        console.log('update command failed checkmod: ' + checkmod(message) + ' words.length: ' + words.length + ' typeof words[1]: ' + typeof words[1] + ' isNaN(words[2]): ' + isNaN(words[2]) + ' isNaN(words[3]): ' + isNaN(words[3]));
        if (checkmod(message) == false) {
            message.channel.send("You do not have permission to use this command")
        } else if (words.length != 4) {
            message.channel.send("Please use the following format: !market update itemname aiValue btcValue")
        } else if (isNaN(words[2]) || isNaN(words[3])) {
            message.channel.send("Please use the following format: \n!cel market update itemname aiValue btcValue \nWhere aiValue and btcValue are numbers, you screwed this part up in the last command")
        }
    }
}

//function to list item value by a given name
function listItem(message, words, pool) {
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
}

function searchItem(message, words, pool) {
    //check the databases for any items with itemname like the search term
    pool.query("SELECT * FROM market WHERE itemname LIKE $1 ORDER BY id desc", ['%' + words[1] + '%'], (err, res) => {
        if (err) {
            console.log(err)
        } else {
            //return all the items with that name with no duplicate item names
            if (res.rows.length != 0) {
                var itemnames = [];
                for (var i = 0; i < res.rows.length; i++) {
                    if (itemnames.indexOf(res.rows[i].itemname) == -1) {
                        itemnames.push(res.rows[i].itemname)
                    }
                }
                message.channel.send("**Items with that name:**\n" + itemnames.join("\n"))
            } else {
                //if there are no items with that name, tell the user there are no items that match that search term
                message.channel.send("There are no items with that name in the database, please try a different search term")
            }
        }
    })
}

//export the functions to use in main.js
module.exports = {
    createItem: createItem,
    updateEntry: updateEntry,
    listItem: listItem,
    searchItem: searchItem
}