class Module {
	constructor(cfg) {
		if (typeof(cfg) == "undefined") {
			cfg = {};
		}
		this.name = cfg.name || "module";
		this.commands = cfg.commands || {};
	}

	matchCommand(command) {
		let {cmd, msg, args, clientUser} = command;
		let commandExists = typeof(this.commands[cmd]) !== "undefined";
		if (commandExists && msg.isMentioned(clientUser.id)) {
			this.commands[cmd](command);
		}
	}
}

module.exports = Module;
