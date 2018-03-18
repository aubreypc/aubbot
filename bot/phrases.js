const Discord = require('discord.js');
const Module = require('./module');
const { choose } = require('./util');

class Phrases extends Module {
	constructor() {
		super();
		this.commands = {
			"i love you": this.love,
			"thank you": this.thanked,
			"thanks": this.thanked,
		} 
	}

	matchCommand(command) {
		// match by whole phrase, not command syntax
		let {msg, text} = command;
		text = text.toLowerCase()
			.trim()
			.replace(/[^\w\s]|_/g, "") // strip punctuation and whitespace
			.replace(/\s+/g, " ");
		if (typeof(this.commands[text]) !== "undefined") {
			console.log(text);
			this.commands[text](command);
		}
	}

	love(command) {
		let {msg} = command;
		let emojis = [":heart:", ":heart_decoration:", ":heart_eyes:", ":sparkling_heart:", ":two_hearts:", ":kissing_heart:"];
		msg.reply(`I love you too! ${choose(emojis)}`);	
	}

	thanked(command) {
		let {msg} = command;
		let responses = [
			"You're welcome!",
			"No problem!",
			"Any time.",
			"Of course!",
			"Happy to help :smiley:",
		];
		msg.reply(choose(responses));
	}
}

module.exports = Phrases;
