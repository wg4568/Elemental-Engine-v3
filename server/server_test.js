const Elemental = require("./server.js");

var server = new Elemental.Server(8080);

server.onConnect = function(client) {
	console.log("CONNECT", client.string());
}

server.onDisconnect = function(client) {
	console.log("DISCONNECT", client.string());
}

server.gameLogic = function() {
	posns = [];
	server.clients.forEach(function(client) {
		posns.push(client.mousePos);
	});
	server.broadcastTrigger("set_positions", posns);
}

server.clientLogic = function(client) {
	if (client.keyPressed(Elemental.Keycodes.SPACE)) {
		console.log("SPACE");
	}
}

server.start();
