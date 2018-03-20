const Discord = require('discord.js');
const Module = require('../module');
const request = require('request');

class Games extends Module {
	constructor() {
		super();
		this.commands = {
			"roll": this.roll.bind(this),
			"play": this.play.bind(this),
			"stop": this.stop.bind(this),
			"skip": this.skip.bind(this),
		};
	}

	matchCommand(cmd) {
		if (typeof(this.trivia) == "object") {
			if (this.trivia.active) {
				this.trivia.matchAnswer(cmd);
			}
		}
		super.matchCommand(cmd);
	}	

	play(cmd) {
		let { msg, args } = cmd;
		args = args.map(a => a.toLowerCase());
		if (args[0] === "trivia") {
			if (!this.trivia || (this.trivia && !this.trivia.active)) {
				this.trivia = new Trivia(msg.channel, msg.otherUsers); 	
				msg.reply("Starting trivia");
			}
		}
	}

	stop(cmd) {
		let { msg, args } = cmd;
		args = args.map(a => a.toLowerCase());
		if (args[0] === "trivia" && this.trivia) {
			this.trivia.stopTimer();
			msg.reply("Stopping trivia");
			this.trivia = false;
		}
	}

	skip(cmd) {
		let {msg, args} = cmd;
		if (this.trivia) {
			this.trivia.skip();
		}
	}

	roll(cmd) {
		let { msg, args } = cmd;
		var n = 1;
		var sides = 6;
		if (args[0]) {
			if (args[0].includes("d")) {
				let split = args[0].split("d");
				n = split[0];
				sides = split[1];
			}
		}

		// bound the roll sizes
		if (n > 20 || sides > 10000) {
			msg.reply("that roll is too much for my little robo-hands!");
			return;
		}
		
		// roll the dice
		let rolls = Array.from({length: n})
			.map(_ => Math.floor(Math.random() * (sides)) + 1);
		let sum = rolls.reduce((x,y) => x + y);

		let embed = new Discord.RichEmbed({
			title: `Roll ${n}d${sides}`,
			description: `**${sum}** = ${rolls.join(" + ")}`,
			color: 10790143
		});

		msg.reply("", {embed: embed});
	}


}

class Trivia {
	constructor(channel, otherUsers) {
		this.state = {i: 0, answerable: false, score: {}, currentCard: null};
		this.channel = channel;
		this.otherUsers = otherUsers;
		this.active = true;
		this.maxScore = 10;
		this.nextQuestion();
	}

	stopTimer() {
		// manually canceling a round
		if (this.state.timeout) {
			clearTimeout(this.state.timeout);
		}
	}

	skip() {
		if (this.active) {
			this.stopTimer();
			this.reveal();
		}
	}

	reveal() {
		this.state.answerable = false;
		let revealed = new Discord.RichEmbed({
			title: "Time's up!",
			description: `The answer was **${this.state.answer}.**`
		});
		this.channel.send(revealed);
		setTimeout((_) => this.nextQuestion(), 2000);
	}

	hint() {
		var allowedChars = Math.floor(this.state.answer.length / 2);
		let punc = ["\"", "'", ",", "-", "/", ".", "!", "(", ")", "[", "]", "{", "}", "<", ">"];
		var clue = this.state.answer.split("")
			.map((c) => {
				if (c == " ") {
					return "  ";
				}
				else if (punc.includes(c)) {
					return c;	
				} else if (Math.random() < 0.4 && allowedChars > 0) {
					allowedChars -= 1;	
					return c;
				} else {
					return "_";
				}
			})
			.join(" ");
		let embed = new Discord.RichEmbed({
			title: `Question ${this.state.i}`,
			description: "",
			fields: [
				{name: `**${this.state.category.toUpperCase()}**`, value: `${this.state.question}\n\`${clue}\``},
			]
		});
		this.channel.send("Here's a hint:", embed);
	}

	matchAnswer(cmd) {
		if (this.state.answerable) {
			let {text, msg} = cmd;
			let re = /(?:")?(?:(?:an\s)|(?:a\s)|(?:the\s))?([^"]+)/;
			let match1 = text.toLowerCase().match(re) || ["",""];
			let match2 = this.state.answer.toLowerCase().match(re) || ["",""];
			// TODO: more sophisticated matching to allow for typos
			if (match1[1] == match2[1]) {
				this.stopTimer();
				this.state.answerable = false;
				let user = msg.author.username;
				if (Object.keys(this.state.score).includes(user)) {
					this.state.score[user] += 1;
					if (this.state.score[user] >= this.maxScore) {
						msg.reply("That is correct! You win!");
						this.active = false;
						this.showScoreboard();
						return;
					}
				} else {
					this.state.score[user] = 1;
				}
				msg.reply("That is correct!");
				this.showScoreboard();
				setTimeout((_) => this.nextQuestion(), 2000);
			}
		}
	}

	showScoreboard() {
		let leaderboard = Object.keys(this.state.score)
			.sort((a,b) => {
				a = this.state.score[a];
				b = this.state.score[b];
				if (a > b) {return 1}
				else if (a < b) {return -1}
				else {return 0}
			})
			.map((u) => `${u}: ${this.state.score[u]} ${this.state.score[u] >= this.maxScore ? ':trophy:' : ''}`)
			.reverse();
		console.log(leaderboard);
		if (leaderboard) {
			let embed = new Discord.RichEmbed({
				title: "Trivia Leaderboard",
				description: leaderboard.join("\n"),
			});

			this.channel.send(embed);
		}
	}

	nextQuestion() {
		request('http://jservice.io/api/random', {json: true}, (err, res, body) => {
			if (err || !body[0].question || !body[0].answer) {console.log("something went wrong", body); return this.nextQuestion()}
			if (body[0].question.includes("seen here")) {this.nextQuestion(); return;} // filter out picture questions
			body = body[0];

			//update game state
			this.state.category = body.category.title;
			this.state.question = body.question;
			this.state.answer = body.answer;
			this.state.answerable = true;
			this.state.i += 1;
			this.state.timer = 30;
			console.log(this.state.answer, this.state.question);

			//filter html tag out of answer
			let match = body.answer.match(/<i>(.*)<\/i>/);
			if (match) {
				this.state.answer = match[1];
			}

			//send embedded message to channel, with dynamic timer
			var embed = (timer) => new Discord.RichEmbed({
				title: `Question ${this.state.i}`,
				description: "",
				fields: [
					{name: `**${this.state.category.toUpperCase()}**`, value: `${this.state.question}`},
				]
			});
			this.channel.send(embed(this.state.timer))
				/*.then((msg) => {
					// after sending, edit to count down timer, cancelling after time runs out	
					let interval = setInterval((_) => {
						if (this.state.timer > 0 && this.state.question == body.question) {
							this.state.timer -= 1;
							msg.edit(embed(this.state.timer));
						} else {
							msg.edit((embed("Question finished!")));
						}
					}, 2000);
					setTimeout((_) => clearInterval(interval), 1000);
				});*/

			//timeout for showing hint
			setTimeout((_) => this.state.question == body.question ? this.hint() : null, 15000);

			//timeout for moving on to next question
			this.state.timeout = setTimeout((_) => (this.state.question == body.question) ? this.reveal() : null, 30000);
		});
	}
}

module.exports = Games;
