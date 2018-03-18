const Games = require('./games/games');
const Phrases = require('./phrases');

class ModuleManager {
	constructor() {
		this.modules = [
			new Games(),
			new Phrases(),
		];
	}

	matchCommand(msg) {
		let mentionedUserIDs = msg.mentions.users.map((u) => u.id);
		let split = msg.content.split(" ")
			// filter out any mentions
			.filter((word) => {
				let re = /^<\D?([\d]+)>/;
				let match = word.match(re);
				if (match) {
					if (mentionedUserIDs.includes(match[1])) {return false;}
				}
				return true;
			});
		var cmd = {
			msg: msg,
			text: split.join(" "), 
			cmd: split[0],
			args: split.slice(1),
			clientUser: this.clientUser,
			otherUsers: this.otherUsers,
		}
		this.modules.forEach((mod) => {
			mod.matchCommand(cmd);	
		});
	}
}

module.exports = ModuleManager;
