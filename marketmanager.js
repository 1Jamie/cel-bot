//add in the postgres stuff and discord stuff since we need it for market managment, can probably remove this from the main.js if we are not using it there
const Discord = require("discord.js");

//main market manager function
function market(message, pool, isNew) {
    //split the message into an array of words and remove the first word (the command)
    var words = message.content.split(" ");
    words.shift();
    words.shift();
    let format = /[`!@#$%^&*()_+\=\[\]{};'"\\|<>\/?~]/;
    let formatflag = false;
    //lazy catch for the import command, we needed to catch it before the format check because it is a special case 
    if (words[0] === "import") {
        csvimporter(message, words, pool);
        return 0;
    }
    words.forEach(element => {
        if (format.test(element)) {
            formatflag = true;
        }
    })
    //if format flag is true, send a message to the channel saying that the format is wrong and exit the function market()
    if (formatflag) {
        message.channel.send("Please use only letters, numbers, and dashes in the market commands. Please check for any special characters other than dashes and try again.");
        return;
    }

    //switch for handling create and edit commands, we are gonna just pass each one with the pool and the message so we can use it in the marketmanager.js file
    switch (words[0]) {
        case "add":
            console.log('using add with values: ' + words[1] + ' ' + words[2] + ' ' + words[3]);
            createItem(message, words, pool)
            break;
        case "delete":
            console.log('using delete with values: ' + words);
            deleteItem(message, words, pool)
            break;
        case "update":
            console.log('update command seen');
            updateItems(message, words, pool)
            break;
        case "delete":
            //do nothing for now
            break;
        case "describe":
            console.log('using describe with values: ' + words);
            addDescription(message, words, pool)
            break;
        case "list":
            //check if there are any items in the database with that name and order them by item id descending
            console.log('running a list on the market with itemname: ' + words[1]);
            listItem(message, words, pool);
            break;
        case "help":
            //tell the user how to use the commands
            message.channel.send("**To add an item listing**:    !cel market add itemname aiValue btcValue\n**To update an item**:    !cel market update itemname aiValue btcValue\n**To delete an item**:    !cel market delete itemname\n**To list all items with that name**:    !cel market list itemname\n**To set an items Description**:    !cel market describe itemname <item description with no special characters except . and space>\n**To search Items**:    !cel market search item \n* *btcvalue and aivalue must be an integer*\n* *itemname must be a string with no spaces and no special characters except dashes(-)* \n* *to use create or update you must be a mod on the server* ");
            break;
        case "search":
            //search for items with that name
            console.log('searching for items with name like: ' + words[1]);
            searchItem(message, words, pool);
            break;
        case "audit":
            //audit the item with that name
            console.log('auditing item with name: ' + words[1]);
            getItemAuditLog(message, words, pool);
            break;
        default:
            //if the command is not recognized, send a message to the channel saying that the command is not recognized
            message.channel.send("That command is not recognized. Please use !cel market help to see the list of commands.");
            break;
    }
}
//function to check mod status, takes in a message and returns true if the message author is a moderator
function checkmod(message) {
    //console.log(message.member.permissions.has("MANAGE_MESSAGES"));//debugging
    if (message.member.roles.cache.has('910564157378666537') || message.member.roles.cache.has('877864461795459142') || message.member.roles.cache.has('926456938772987904')) {
        return true;
    } else {
        return false;
    }
}

//stupid function for the error message, yes i am that lazy
function genericError(message) {
    message.channel.send("Well crap, it seems something went wrong. please try again after checking your input and/or contact a moderator if the problem persists.");
}

//function to go into the database and get the itemid of the item with the name given
function getItemID(pool, itemname, desc) {
    return new Promise(function (resolve, reject) {
        pool.query("SELECT * FROM itemnames WHERE name = $1", [itemname], function (err, result) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                if (result.rows.length == 0) {
                    resolve(null);
                } else {
                    if (desc) {
                        let returnObj = {
                            itemid: result.rows[0].id,
                            desc: result.rows[0].description
                        }
                        resolve(returnObj);
                    } else if (!desc) {
                        resolve(result.rows[0].id);
                    }
                }
            }
        });
    });
}


//function to add values to itemvalues takes pool, words
function addItemValues(pool, words, itemid) {
    return new Promise(function (resolve, reject) {
        pool.query("INSERT INTO itemvalues (itemid, aivalue, btcvalue) VALUES ($1, $2, $3)", [itemid, words[1], words[2]], function (err, result) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

//function for adding an entry to auditlog, takes pool, words, itemid
function addAuditLog(pool, words, itemid, message, command) {
    return new Promise(function (resolve, reject) {
        pool.query("INSERT INTO auditlog (command, whodid, wheredid, whendid, itemid, whatdid) VALUES ($1, $2, $3, $4, $5, $6)", [command, message.author.username, message.guild.name, new Date(), itemid, words], (err, res) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

//function to create a new item, takes in a message, words array, and a pool. Immediately remove the first element of words as it was the create command
function createItem(message, words, pool) {
    words.shift();
    //check if the message author is a moderator and that the array has 3 elements and the first one is a string
    if (checkmod(message) && words.length == 3 && typeof words[0] == "string") {
        //check if the item already exists in table itemNames in column name
        pool.query("SELECT name FROM itemNames WHERE name = $1", [words[0]], (err, res) => {
            if (err) {
                console.log(err);
                return;
            } else {
                //console.log(res.rows);//debugging
                //if the item does not exist, insert the item into the table itemNames with the name of the message author and the server id
                if (res.rows.length == 0) {
                    pool.query("INSERT INTO itemNames (name) VALUES ($1)", [words[0]], (err, res) => {
                        if (err) {
                            console.log(err);
                            genericError(message);
                            return;
                        } else {
                            //use function getItemID to get the itemid of the item we just inserted
                            getItemID(pool, words[0]).then(function (itemid) {
                                //add the values to the table itemValues with the id of the item from the table itemNames and the values of the message
                                addItemValues(pool, words, itemid).then(function (result) {
                                    message.channel.send('Item add successful!\nItem name: ' + words[0] + '\nAI Value: ' + words[1] + '\nBTC Value: ' + words[2] + '\nItem ID: ' + itemid);
                                    //add the entry to the auditlog
                                    addAuditLog(pool, words, itemid, message, "create").then(function (result) {
                                        console.log('added to auditlog');
                                    }).catch(function (err) {
                                        console.log(err);
                                    });
                                }).catch(function (err) {
                                    console.log(err);
                                    genericError(message);
                                });
                            }).catch(function (err) {
                                console.log(err);
                                genericError(message);
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
            message.channel.send("Sorry but you do not have access to this command. Only Moderators, VIPs and Elders can use this command currently.");
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
        getItemID(pool, words[0]).then(function (itemid) {
            if (itemid == null) {
                message.channel.send("Item does not exist!");
            } else {
                addItemValues(pool, words, itemid).then(function (result) {
                    message.channel.send('Item update successful!\nItem name: ' + words[0] + '\nAI Value: ' + words[1] + '\nBTC Value: ' + words[2] + '\nItem ID: ' + itemid);
                    //add the entry to the auditlog
                    addAuditLog(pool, words, itemid, message, "update").then(function (result) {
                        console.log('added to auditlog');
                    }).catch(function (err) {
                        console.log(err);
                    });
                }).catch(function (err) {
                    console.log(err);
                    genericError(message);
                });
            }
        }).catch(function (err) {
            console.log(err);
            genericError(message);
        });
    } else {
        //if the user is not a moderator or the array is not 3 elements long, tell the user they are not allowed to use the command or they did not enter the correct number of arguments
        if (!checkmod(message)) {
            message.channel.send("Sorry but you do not have access to this command. Only Moderators, VIPs and Elders can use this command currently.");
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
        getItemID(pool, words[0]).then(function (itemid) {
            if (itemid == null) {
                message.channel.send("Item does not exist!");
                return;
            } else {
                pool.query("SELECT * FROM auditlog WHERE itemid = $1", [itemid], (err, res) => {
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
                            message.channel.send("No commands found for this item.1");
                        }
                    }
                });
            }
        }).catch(function (err) {
            console.log(err);
            genericError(message);
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
        getItemID(pool, words[0], true).then(function (returnObj) {
            let itemid = returnObj.itemid;
            let itemdesc = returnObj.desc;
            if (itemid == null) {
                message.channel.send("Item does not exist!");
            } else {
                pool.query("SELECT * FROM itemValues WHERE itemid = $1 ORDER BY id DESC LIMIT 1", [itemid], (err, res) => {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        //if there are rows in the table
                        if (res.rows.length > 0) {
                            //make a variable for the aiValue and btcValue since i cant access it once i make the enxt psql call
                            let aiValue = res.rows[0].aivalue;
                            let btcValue = res.rows[0].btcvalue;
                            pool.query("SELECT whodid, whendid FROM auditlog WHERE itemid = $1 ORDER BY id DESC LIMIT 1", [itemid], (err, res) => {
                                if (err) {
                                    console.log(err);
                                    return;
                                } else {
                                    if (res.rows.length > 0) {
                                        //use the function getAICoresBTCValue to get the btcValue of ai-cores and put the return into a variable
                                        getAICoresBTCValue(pool).then((value) => {
                                            let aiCoresBTCValue = value;
                                            let calculatedBTCValue = aiValue * aiCoresBTCValue;
                                            //tell the user what the items name is, the aiValue, the btcValue, whodid, whendid and what the itemid is
                                            message.channel.send("**Item:** " + words[0] + "\n" + "**AI Value:** " + aiValue + "\n" + "**BTC Value:** " + btcValue + "\n" + "**calculated BTC Value:** " + calculatedBTCValue + "\n" + "**Updated by:** " + res.rows[0].whodid + "\n" + "**Last updated:** " + res.rows[0].whendid + "\n" + "*Item ID:* " + itemid + "\n" + "*Description*: " + itemdesc);
                                        });
                                    } else {
                                        //if there are no rows in the table, tell the user there are no commands
                                        message.channel.send("No values in audit log found for this item.");
                                    }
                                }
                            });
                        } else {
                            //if there are no rows in the table, tell the user there are none
                            message.channel.send("No values found for this item.");
                        }
                    }
                });
            }
        }).catch(function (err) {
            console.log(err);
            genericError(message);
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


//function to delete an item by a given name and all its associated values in itemvalues
function deleteItem(message, words, pool) {
    words.shift();
    //check that the command has one element
    if (words.length == 1) {
        //make sure they are a moderator
        if (checkmod(message)) {
            //get the items id with getItemID
            getItemID(pool, words[0]).then(function (itemid) {
                //make sure itemid is not null
                if (itemid != null) {
                    //delete all the rows in itemValues where the itemid is the same as the itemid from the table itemNames
                    pool.query("DELETE FROM itemValues WHERE itemid = $1", [itemid], (err, res) => {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            //delete the row in itemNames where the id is the same as the itemid
                            pool.query("DELETE FROM itemNames WHERE id = $1", [itemid], (err, res) => {
                                if (err) {
                                    console.log(err);
                                    return;
                                } else {
                                    //tell the user the item was deleted
                                    message.channel.send("Item deleted.");
                                    //add the delete command to the auditlog
                                    addAuditLog(pool, words, itemid, message, "delete");
                                }
                            });
                        }
                    });
                } else {
                    //if the itemid is null, tell the user the item does not exist
                    message.channel.send("Item does not exist!");
                }
            }).catch(function (err) {
                console.log(err);
                genericError(message);
            });
        } else {
            //if the user is not a moderator, tell the user they are not allowed to use the command
            message.channel.send("Sorry but you do not have access to this command.");
        }
    } else {
        //if the inputs are not 1 element long tell the user input is not correct
        if (words.length != 1) {
            message.channel.send("Please enter the correct number of arguments. spaces are not allowed, please use dashes instead");
        }
    }
}

//function to add a description to an item
function addDescription(message, words, pool) {
    words.shift();
    let item = words[0];
    console.log("item: " + item);
    words.shift();
    let description = words.join(" ");
    console.log(`description: ` + description)
    if (checkmod(message)) {
        getItemID(pool, item).then(function (itemid) {
            //update the itemNames table with the new description
            if (itemid == null) {
                message.channel.send("Item does not exist!");
            } else {
                console.log('running update on id: ' + itemid + ' with description: ' + description);
                pool.query("UPDATE itemNames SET description = $1 WHERE id = $2", [description, itemid], (err, res) => {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        //tell the user the item was updated
                        message.channel.send("Item description updated. New information: \n" + "**Item:** " + item + "\n" + "**Item ID**:" + itemid + "\n" + "**Description**: " + description);
                        //trim description to fit in the database with only the first 50 characters
                        description = description.substring(0, 50);
                        //add the update command to the auditlog
                        addAuditLog(pool, description, itemid, message, "Description updated");
                    }
                });
            }
        }).catch(function (err) {
            console.log(err);
            genericError(message);
        });
    } else {
        message.channel.send("Sorry but you do not have access to this command.");
    }
}

//function to take a csv input and add all the items to the itemNames table itemValues table and auditlog table
function csvimporter(message, words, pool) {
    words.shift();
    //make sure the user is a moderator
    if (checkmod(message)) {
        //take all characters after : and put them into a variable
        let csv = message.content.split(':')[1];
        console.log('incoming csv: ' + csv);
        //split the csv into an array
        let csvArray = csv.split('\n');
        csvArray.shift();
        //loop through the array
        let updateLst = [];
        let addLst = [];
        console.log('csvArray: ' + csvArray);
        csvArray.forEach(function (item) {
            //split the array into an array of words
            let row = item.split(',');
            //reove all white space from the row
            row = row.map(function (word) {
                return word.trim();
            });
            if (row.length == 4) {
                //check that the item does not already exist
                getItemID(pool, row[0]).then(function (itemid) {
                    if (itemid == null) {
                        console.log('item does not exist adding item: ' + row[0]);
                        //make sure row [1] is a float and row [2] is not a float
                        if (isFloat(row[1]) && !isFloat(row[2])) {
                            message.channel.send("there was a decimal in BTC or ai value is too big, please check the values of this entry" + row);
                            return;
                        }
                        //add it to the itemNames table
                        pool.query("INSERT INTO itemNames (name) VALUES ($1)", [row[0]], (err, res) => {
                            if (err) {
                                console.log(err);
                                console.log('error adding item to itemNames: ', message.author.username, message.guild.name, new Date(), "importer", itemid, row);
                                return;
                            } else {
                                //get the id of the item just added
                                console.log('item added');
                                //add it to the addLst array
                                addLst.push(row[0]);
                                getItemID(pool, row[0]).then(function (itemid) {
                                    //add the item to the itemValues table
                                    pool.query("INSERT INTO itemValues (itemid, aivalue, btcvalue) VALUES ($1, $2, $3)", [itemid, row[2], row[3]], (err, res) => {
                                        if (err) {
                                            console.log(err);
                                            console.log('error adding item to itemValues: ' + message.author.username, message.guild.name, new Date(), "importer", itemid, row);
                                            return;
                                        } else {
                                            //add the item to the auditlog table
                                            console.log("Item added from Importer: " + row[0]);
                                            pool.query("INSERT INTO auditlog (whodid, wheredid,whendid,command,itemid,whatdid) VALUES ($1, $2, $3, $4, $5, $6)", [message.author.username, message.guild.name, new Date(), "importer", itemid, row], (err, res) => {
                                                if (err) {
                                                    console.log(err);
                                                    console.log('error adding item to auditlog: ' + message.author.username, message.guild.name, new Date(), "importer", itemid, row);
                                                    return;
                                                } else {
                                                    //log the item added to the console
                                                    console.log("auditlog updated " + row[0]);
                                                    if (csvArray.indexOf(item) == csvArray.length - 1) {
                                                        message.channel.send("Items added: " + addLst.length + "\n" + addLst + "\n" + "Items updated: " + updateLst.length + "\n" + updateLst);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }).catch(function (err) {
                                    console.log(err);
                                    genericError(message);
                                });
                            }
                        });
                    } else {
                        //if the item already exists, add the new values to the itemValues table
                        console.log('item exists updating item: ' + row[0]);
                        pool.query("insert into itemValues (itemid, aivalue, btcvalue) values ($1, $2, $3)", [itemid, row[2], row[3]], (err, res) => {
                            if (err) {
                                console.log(err);
                                console.log('error adding item to itemValues: ', message.author.username, message.guild.name, new Date(), "importer", itemid, row);
                                return;
                            } else {
                                //add the item to the auditlog table
                                updateLst.push(row[0]);
                                pool.query("INSERT INTO auditlog (whodid, wheredid,whendid,command,itemid,whatdid) VALUES ($1, $2, $3, $4, $5, $6)", [message.author.username, message.guild.name, new Date(), "importer", itemid, row], (err, res) => {
                                    if (err) {
                                        console.log(err);
                                        console.log('error updating audit log: ', message.author.username, message.guild.name, new Date(), "importer", itemid, row)
                                        return;
                                    } else {
                                        //log the item added to the console
                                        updateLst.push(row[0]);
                                        console.log("Item updated from Importer: " + row[0]);
                                        if (csvArray.indexOf(item) == csvArray.length - 1) {
                                            //sort the updateLst array and aaddLst array
                                            updateLst.sort();
                                            addLst.sort();
                                            console.log('last item in csvArray added, importing complete');
                                            message.channel.send("Items added: " + addLst.length + "\n" + addLst + "\n" + "Items updated: " + updateLst.length + "\n" + updateLst);
                                        }
                                    }
                                });
                            }
                        });
                    }
                }).catch(function (err) {
                    console.log(err);
                    genericError(message);
                });
                //if its the last element in the array, send a message to the user
            } else {
                //if the array is not 3 elements long, tell the user the csv is not correct
                console.log("csv is not correct");
            }
        })
        console.log('csv imported');
        console.log('addLst: ' + addLst);
        console.log('updateLst: ' + updateLst);
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
            if (res.rows.length > 0) {
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
    market: market
}