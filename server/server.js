const WebSocket = require("ws");

const server = new WebSocket.Server({port: 8080});

var clients = [];
clients.Print = function() {
	var str = "[";
	clients.forEach(function(client, ind){
		if (ind != 0) str += " ";
		str += client.toString();
	});
	str += "]";
	console.log(str);
}

class Tools {
	static GenerateID() {
		var s1 = Math.random().toString(36).substring(2, 15);
		var s2 = Math.random().toString(36).substring(2, 15);
		return s1 + s2
	}

	static GenerateSafeID() {
		var id = Tools.GenerateID();
		while (Tools.ClientByID(id) != null) {
			id = Tools.GenerateID();
		}
		return id;
	}

	static ClientByID(id) {
		var selected = null;
		clients.forEach(function(client){
			if (client.id == id) {
				selected = client;
			}
		});
		return selected;
	}
}

class Client {
	constructor(socket) {
		this.socket = socket;
		this.id = Tools.GenerateSafeID();

		var parent = this;
		this.socket.on("message", function(message) {
			parent.onMessage(message);
		});
		this.socket.on("close", function(){
			parent.onClose();
		});
	}

	toString() {
		return `Client(${this.id})`;
	}

	onMessage(message) {
		console.log(message);
	}

	onClose() {
		var ind = clients.indexOf(this);
		if (ind != -1) clients.splice(ind, 1);
		console.log("CLOSE");
	}
}

server.on("connection", function(socket) {

	var client = new Client(socket);
	clients.push(client);

	clients.Print();

});
