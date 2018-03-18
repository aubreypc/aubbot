function choose(items) {
	return items[Math.floor(Math.random() * (items.length))];
}

module.exports.choose = choose;
