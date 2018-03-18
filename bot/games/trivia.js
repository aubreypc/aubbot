const Discord = require('discord.js');
const Module = require('../module');
const request = require('request');
const EventEmitter = require('events').EventEmitter;

class Trivia {
	constructor() {
		this.emitter = new EventEmitter();
		this.questions = {};
		this.scoreboard = {};
	}

}
