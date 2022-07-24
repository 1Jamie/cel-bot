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

//stupid function for the error message, yes i am that lazy
function genericError(message) {
    message.channel.send("Well crap, it seems something went wrong. please try again after checking your input and/or contact a moderator if the problem persists.");
}

//function to create a new item, takes in a message, words array, and a pool. Immediately remove the first element of words as it was the create command
function createItem(message, words, pool) {
    words.shift();
    console.log('shifted, new words are: ' + words);
    //check if the message author is a moderator and that the array has 3 elements and the first one is a string
    if (checkmod(message) && words.length == 3 && typeof words[0] == "string") {
        //check if the item already exists in table itemNames in column name
        pool.query("SELECT name FROM itemNames WHERE name = $1", [words[0]], (err, res) => {
            if (err) {
                console.log(err);
                return;
            } else {
                console.log(res.rows);
                //if the item does not exist, insert the item into the table itemNames with the name of the message author and the server id
                if (res.rows.length == 0) {
                    pool.query("INSERT INTO itemNames (name) VALUES ($1)", [words[0]], (err, res) => {
                        if (err) {
                            console.log(err);
                            genericError(message);
                            return;
                        } else {
                            //we are legit just getting the entry we just set to use in the autdit command and the itemvalue table.... but i know this is a stupid way to do this, bur res.row on the insert is not returning the row for some dumb reason.
                            pool.query("SELECT id FROM itemnames WHERE name = $1", [words[0]], (err, res) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    let itemid = res.rows[0].id;
                                    //add the values to the table itemValues with the id of the item from the table itemNames and the values of the message
                                    pool.query("INSERT INTO itemValues (itemid, aiValue, btcValue) VALUES ($1, $2, $3)", [itemid, words[1], words[2]], (err, res) => {
                                        if (err) {
                                            console.log(err);
                                            genericError(message);
                                            return;
                                        } else {
                                            //tell the user the item was created, what values were set and what the new id is
                                            message.channel.send("Item created!\nItem name: " + words[0] + "\nItem ID: " + itemid + "\nAI Value: " + words[1] + "\nBTC Value: " + words[2]);
                                            //add change to the auditlog table with words as command, message.author.username as whodid, message.guild.name as wheredid, and the timestamp with time zone as whedid
                                            pool.query("INSERT INTO auditlog (command, whodid, wheredid, whendid, itemid, whatdid) VALUES ($1, $2, $3, $4, $5, $6)", ["create", message.author.username, message.guild.name, new Date(), itemid, words], (err, res) => {
                                                if (err) {
                                                    console.log(err + '\n' + 'error adding to auditlog');
                                                    return;
                                                } else {
                                                    console.log('auditlog updated')
                                                    return;
                                                }
                                            })
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    //if the item already exists, tell the user it already exists
                    message.channel.send("Item already exists! Please use the update command to update the values of the item.");
                }
            }
        });
    } else {
        //if the user is not a moderator or the array is not 3 elements long, tell the user they are not allowed to use the command or they did not enter the correct number of arguments
        if (!checkmod(message)) {
            message.channel.send("Sorry but you do not have access to this command.");
        } else if (words.length != 3) {
            message.channel.send("Please enter the correct number of arguments. spaces are not allowed, please use dashes instead");
        }
    }
}

//updateitem function, takes in a message, words array, and a pool. Immediately remove the first element of words as it was the update command
function updateItems(message, words, pool) {
    words.shift();
    //check if the user is a mod and that the command has three elements
    if (checkmod(message) && words.length == 3) {
        //check if the item exists in the table itemNames in column name
        pool.query("SELECT id FROM itemNames WHERE name = $1", [words[0]], (err, res) => {
            if (err) {
                console.log(err);
                return;
            } else {
                //if the item exists create a variable called itemid and set it to the id of the item
                if (res.rows.length == 1) {
                    let itemid = res.rows[0].id;
                    console.log(res.rows);
                    console.log(itemid);
                    //add a new row to the table itemValues with the itemid as itemid and words as the values
                    console.log('inserting into itemValues' + itemid + ' ' + words[1] + ' ' + words[2]);
                    pool.query("INSERT INTO itemValues (itemid, aiValue, btcValue) VALUES ($1, $2, $3)", [itemid, words[1], words[2]], (err, res) => {
                        if (err) {
                            console.log(err);
                            genericError(message);
                            return;
                        } else {
                            //tell the user the item was updated and what the new values are
                            message.channel.send("Item updated!\nItem name: " + words[0] + "\nItem ID: " + itemid + "\nAI Value: " + words[1] + "\nBTC Value: " + words[2]);
                            //add change to the auditlog table with words as command, message.author.username as whodid, message.guild.name as wheredid, and the timestamp with time zone as whedid
                            pool.query("INSERT INTO auditlog (command, whodid, wheredid, whendid, itemid, whatdid) VALUES ($1, $2, $3, $4, $5, $6)", ["update", message.author.username, message.guild.name, new Date(), itemid, words], (err, res) => {
                                if (err) {
                                    console.log(err + '\n' + 'error adding to auditlog');
                                    return;
                                } else {
                                    console.log('auditlog updated')
                                    return;
                                }
                            })
                        }
                    });
                } else {
                    //if the item does not exist, tell the user it does not exist
                    message.channel.send("Item does not exist! Please use the create command to create the item.");
                }
            }
        });
    } else {
        //if the user is not a moderator or the array is not 3 elements long, tell the user they are not allowed to use the command or they did not enter the correct number of arguments
        if (!checkmod(message)) {
            message.channel.send("Sorry but you do not have access to this command.");
        } else if (words.length != 3) {
            message.channel.send("Please enter the correct number of arguments. spaces are not allowed, please use dashes instead");
        }
    }
}

//function to check the auditlog table and return all commands related to an item
function getItemAuditLog(message, words, pool) {
    words.shift();
    //check if the user is a mod and that the command has one element
    if (checkmod(message) && words.length == 1) {
        //get the items id from the table itemNames in column id
        pool.query("SELECT id FROM itemNames WHERE name = $1", [words[0]], (err, res) => {
            if (err) {
                console.log(err);
                return;
            } else {
                //if the item exists select all rows from audit log where itemid is the id of the item
                if (res.rows.length === 1) {
                    pool.query("SELECT * FROM auditlog WHERE itemid = $1", [res.rows[0].id], (err, res) => {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            //if there are rows in the table, tell the user the commands, whatdid, whodid, wheredid, and whendid
                            if (res.rows.length > 0) {
                                let auditlog = "";
                                for (let i = 0; i < res.rows.length; i++) {
                                    auditlog += "Command: " + res.rows[i].command + "\n" + "Who did it: " + res.rows[i].whodid + "\n" + "Where did it: " + res.rows[i].wheredid + "\n" + "When did it: " + res.rows[i].whendid + "\n" + "What did it: " + res.rows[i].whatdid + "\n";
                                }
                                message.channel.send(auditlog);
                            } else {
                                //if there are no rows in the table, tell the user there are no commands
                                message.channel.send("No commands found for this item.");
                            }
                        }
                    });
                } else {
                    //if the item does not exist, tell the user it does not exist
                    message.channel.send("Item does not exist! please search audit log for existing items.");
                }
            }
        });
    } else {
        //if the user is not a moderator or the array is not 1 elements long, tell the user they are not allowed to use the command or they did not enter the correct number of arguments
        if (!checkmod(message)) {
            message.channel.send("Sorry but you do not have access to this command.");
        } else if (words.length != 1) {
            message.channel.send("Please enter the correct number of arguments. spaces are not allowed, please use dashes instead");
        }
    }
}

//function that returns a promise of the value of ai-cores btcvalue
function getAICoresBTCValue(pool) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT id FROM itemNames WHERE name = $1", ["ai-core"], (err, res) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                if (res.rows.length == 1) {
                    let itemid = res.rows[0].id;
                    pool.query("SELECT btcvalue FROM itemValues WHERE itemid = $1 ORDER BY id DESC LIMIT 1", [itemid], (err, res) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        } else {
                            if (res.rows.length == 1) {
                                resolve(res.rows[0].btcvalue);
                            } else {
                                resolve(0);
                            }
                        }
                    });
                } else {
                    resolve(0);
                }
            }
        });
    });
}



//function to list item value by a given name
function listItem(message, words, pool) {
    words.shift();
    //check that the command has one element
    if (words.length == 1) {
        //get the items id from the table itemNames in column id
        pool.query("SELECT id FROM itemNames WHERE name = $1", [words[0]], (err, res) => {
            if (err) {
                console.log(err);
                return;
            } else {
                //if the item exists select one row from tables itemValues and auditlog where itemid is the id of the item ordered by id descending
                if (res.rows.length === 1) {
                    //lets make a variable for the itemid
                    let itemid = res.rows[0].id;
                    pool.query("SELECT * FROM itemValues WHERE itemid = $1 ORDER BY id DESC LIMIT 1", [itemid], (err, res) => {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            //if there are rows in the table
                            if (res.rows.length > 0) {
                                console.log(res.rows[0]);
                                //make a variable for the aiValue and btcValue
                                let aiValue = res.rows[0].aivalue;
                                let btcValue = res.rows[0].btcvalue;

                                console.log(aiValue + " " + btcValue);
                                //do another query to the auditlog to get the whodid and whendid
                                pool.query("SELECT whodid, whendid FROM auditlog WHERE itemid = $1 ORDER BY id DESC LIMIT 1", [itemid], (err, res) => {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    } else {
                                        if (res.rows.length > 0) {
                                            //use the function getAICoresBTCValue to get the btcValue of ai-cores and put the return into a variable
                                            getAICoresBTCValue(pool).then((value) => {
                                                let aiCoresBTCValue = value;
                                                console.log("promise resolved" + value);
                                                console.log('Returned AI value: ' + aiCoresBTCValue);
                                                let calculatedBTCValue = aiValue * aiCoresBTCValue;
                                                //tell the user what the items name is, the aiValue, the btcValue, whodid, whendid and what the itemid is
                                                message.channel.send("**Item:** " + words[0] + "\n" + "**AI Value:** " + aiValue + "\n" + "**BTC Value:** " + btcValue + "\n" + "**calculated BTC Value:** " + calculatedBTCValue + "\n" + "**Updated by:** " + res.rows[0].whodid + "\n" + "**Last updated:** " + res.rows[0].whendid + "\n" + "*Item ID:* " + itemid);
                                            });
                                        } else {
                                            //if there are no rows in the table, tell the user there are no commands
                                            message.channel.send("No commands found for this item.");
                                        }
                                    }
                                });
                            } else {
                                //if there are no rows in the table, tell the user there are no commands
                                message.channel.send("No values found for this item.");
                            }
                        }
                    });
                } else {
                    //if the item does not exist, tell the user it does not exist
                    message.channel.send("Item does not exist! please search for items in the market.");
                }
            }
        });
    } else {
        //if there is not one element in the array tell the user the command is not correct
        message.channel.send("Please enter the correct number of arguments. spaces are not allowed, please use dashes instead");
    }
}




function searchItem(message, words, pool) {
    words.shift();
    //check the databases for any items with itemname like the search term
    pool.query("SELECT * FROM itemNames WHERE name LIKE $1", ["%" + words[0] + "%"], (err, res) => {
        if (err) {
            console.log(err);
            return;
        } else {
            //if there are rows in the table tell the user the list of items
            if (res.rows.length > 0){
                let itemList = "";
                for (let i = 0; i < res.rows.length; i++) {
                    itemList += res.rows[i].name + "\n";
                }
                message.channel.send("**Items found:**\n" + itemList);
            } else {
                //if there are no rows in the table tell the user there are no items
                message.channel.send("No items found.");
            }
        }
    });
}

//export the functions to use in main.js
module.exports = {
    updateItems: updateItems,
    createItem: createItem,
    listItem: listItem,
    searchItem: searchItem,
    getItemAuditLog: getItemAuditLog
}