const Discord = require('discord.js');
const Manager = require('./bot/moduleManager');

const client = new Discord.Client();
const token = process.argv[2];
const manager = new Manager();


client.on('ready', () => {
	manager.clientUser = client.user;
	manager.otherUsers = client.users;
	console.log(client.user.username);
	console.log('I am ready!');
});

client.on('message', msg => {
	manager.matchCommand(msg);
});

client.login(token);
