// Import server code
const Elemental = require("./server.js");

// Set up server on port 80, at 60 ticks/second
var server = new Elemental.Server(5001, tickrate=60);

// Define target movespeed
var movespeed = 5;

// Called when client connects
server.onConnect = function(client) {
	// Set color and position
	client.color = Elemental.Helpers.RandomColor();
	client.tankpos = Elemental.Vector.Empty;

	// Send some basic information to the client
	client.callTrigger("configure", {id: client.id, color: client.color.formatHEX(), movespeed: movespeed});

	// Print a console alert
	console.log("CONNECT", client.string());
}

// When a client disconnects, print in console
server.onDisconnect = function(client) {
	console.log("DISCONNECT", client.string());
}

// Called every frame (60 times a second)
server.gameLogic = function() {
	// Store a bunch of info about all connected players in an array
	players = [];
	server.clients.forEach(function(client) {
		players.push({
			"color": client.color.formatHEX(),
			"position": client.tankpos,
			"id": client.id,
			"angle": client.angle
		});
	});
	// Send array to every connected client, through 'update' function
	server.broadcastTrigger("update", players);
}

// Called every frame, for each client connected
server.clientLogic = function(client) {
	// Get movement into a vector
	var movement = Elemental.Vector.Empty;
	if (client.keyHeld(Elemental.Keycodes.W)) movement.y -= movespeed;
	if (client.keyHeld(Elemental.Keycodes.S)) movement.y += movespeed;
	if (client.keyHeld(Elemental.Keycodes.A)) movement.x -= movespeed;
	if (client.keyHeld(Elemental.Keycodes.D)) movement.x += movespeed;

	// Add movement to tank position
	client.tankpos = Elemental.Vector.Add(client.tankpos, movement);

	// Calculate barrel angle from mouse position and tank position
	client.angle = Elemental.Helpers.AngleBetween(client.mousePos, client.tankpos);
}

// Run the server
server.start();
