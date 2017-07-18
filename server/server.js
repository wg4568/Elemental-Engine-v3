const WebSocket = require("ws");

const server = new WebSocket.Server({port: 8080});
const SERVER_RATE = 60;

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
		this.socket.on("close", function(){
			parent.onClose();
		});
		this.socket.on("message", function(message) {
			parent.onMessage(message);
		});

		this.keyboardState = {pressed: {}, held: {}, released: {}};
		this.mouseState = {pressed: {}, held: {}, released: {}};
		this.mousePos = Vector.Empty;
	}

	log(message) {
		console.log(this.toString(), message);
	}

	sendJson(obj) {
		this.socket.send(JSON.stringify(obj));
	}

	toString() {
		return `Client(${this.id})`;
	}

	onClose() {
		var ind = clients.indexOf(this);
		if (ind != -1) clients.splice(ind, 1);
		this.log("Disconnected");
	}

	doLogic() {
		clientLogic(this);

		this.keyboardState.pressed = {};
		this.keyboardState.released = {};

		this.mouseState.pressed = {};
		this.mouseState.released = {};
	}

	keyPressed(keycode) {
		var value = this.keyboardState.pressed[keycode];
		if (value == 1) return true;
		else return false;
	}
	keyHeld(keycode) {
		var value = this.keyboardState.held[keycode];
		if (value == 1) return true;
		else return false;
	}
	keyReleased(keycode) {
		var value = this.keyboardState.released[keycode];
		if (value == 1) return true;
		else return false;
	}

	mousePressed(button) {
		var value = this.mouseState.pressed[button];
		if (value == 1) return true;
		else return false;
	}
	mouseHeld(button) {
		var value = this.mouseState.held[button];
		if (value == 1) return true;
		else return false;
	}
	mouseReleased(button) {
		var value = this.mouseState.released[button];
		if (value == 1) return true;
		else return false;
	}

	onMessage(msgRaw) {
		var message = JSON.parse(msgRaw);

		if (message.event == "keyPressed") {
			if (!this.keyHeld(message.key)) {
				this.keyboardState.pressed[message.key] = 1;
			}
			this.keyboardState.held[message.key] = 1;
		}
		if (message.event == "keyReleased") {
			this.keyboardState.released[message.key] = 1;
			this.keyboardState.held[message.key] = 0;
		}
		if (message.event == "mousePressed") {
			if (!this.mouseHeld(message.button)) {
				this.mouseState.pressed[message.button] = 1;
			}
			this.mouseState.held[message.button] = 1;
		}
		if (message.event == "mouseReleased") {
			this.mouseState.released[message.button] = 1;
			this.mouseState.held[message.button] = 0;
		}
		if (message.event == "mouseMoved") {
			this.mousePos = new Vector(message.position.x, message.position.y);
		}
	}
}

setInterval(function(){
	clients.forEach(function(client){
		client.doLogic();
	});
}, 1000/SERVER_RATE);

server.on("connection", function(socket) {

	var client = new Client(socket);
	client.log("Connected");
	clients.push(client);

});

function clientLogic(client) {
	posns = {};
	clients.forEach(function(cli){
		posns[cli.id] = {x: cli.mousePos.x, y: cli.mousePos.y};
	});
	client.sendJson({
		"kind": "trigger",
		"trigger": "set_players",
		"data": posns
	})
}

// Vector class
class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	static get Empty() {
		return {x: 0, y: 0};
	}

	static IsVector(vector) {
		return vector.hasOwnProperty("x") && vector.hasOwnProperty("y");
	}

	static Inverse(vector) {
		return Elemental.Vector.Multiply(vector, -1);
	}

	static Add() {
		var total = new Elemental.Vector(0, 0);
		for (var i = 0; i < arguments.length; i++ ) {
			if (Elemental.Vector.IsVector(arguments[i])) {
				total.x += arguments[i].x;
				total.y += arguments[i].y;
			} else {
				total.x += arguments[i];
				total.y += arguments[i];
			}
		}
		return total;
	}

	static Subtract() {
		var total = new Elemental.Vector(arguments[0].x, arguments[0].y);
		for (var i = 1; i < arguments.length; i++ ) {
			if (Elemental.Vector.IsVector(arguments[i])) {
				total.x -= arguments[i].x;
				total.y -= arguments[i].y;
			} else {
				total.x -= arguments[i];
				total.y -= arguments[i];
			}
		}
		return total;
	}

	static Multiply() {
		var total = new Elemental.Vector(1, 1);
		for (var i = 0; i < arguments.length; i++ ) {
			if (Elemental.Vector.IsVector(arguments[i])) {
				total.x *= arguments[i].x;
				total.y *= arguments[i].y;
			} else {
				total.x *= arguments[i];
				total.y *= arguments[i];
			}
		}
		return total;
	}

	static Divide() {
		var total = new Elemental.Vector(arguments[0].x, arguments[0].y);
		for (var i = 1; i < arguments.length; i++ ) {
			if (Elemental.Vector.IsVector(arguments[i])) {
				total.x /= arguments[i].x;
				total.y /= arguments[i].y;
			} else {
				total.x /= arguments[i];
				total.y /= arguments[i];
			}
		}
		return total;
	}
}

// Mouse and keycode definitions
var Keycodes = {
	BACKSPACE: 8,
	TAB: 9,
	ENTER: 13,
	SHIFT: 16,
	CTRL: 17,
	ALT: 18,
	BREAK: 19,
	CAPSLOCK: 20,
	ESCAPE: 27,
	SPACE: 32,
	PGUP: 33,
	PGDOWN: 34,
	END: 35,
	HOME: 36,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	INSERT: 45,
	DELETE: 46,
	N0: 48,
	N1: 49,
	N2: 50,
	N3: 51,
	N4: 52,
	N5: 53,
	N6: 54,
	N7: 55,
	N8: 56,
	N9: 57,
	A: 65,
	B: 66,
	C: 67,
	D: 68,
	E: 69,
	F: 70,
	G: 71,
	H: 72,
	I: 73,
	J: 74,
	K: 75,
	L: 76,
	M: 77,
	N: 78,
	O: 79,
	P: 80,
	Q: 81,
	R: 82,
	S: 83,
	T: 84,
	U: 85,
	V: 86,
	W: 87,
	X: 88,
	Y: 89,
	Z: 90,
	LWIN: 91,
	RWIN: 92,
	SELECT: 93,
	NUM0: 96,
	NUM1: 97,
	NUM2: 98,
	NUM3: 99,
	NUM4: 100,
	NUM5: 101,
	NUM6: 102,
	NUM7: 103,
	NUM8: 104,
	NUM9: 105,
	MULTIPLY: 106,
	ADD: 107,
	SUBTRACT: 109,
	PERIOD: 110,
	DIVIDE: 111,
	F1: 112,
	F2: 113,
	F3: 114,
	F4: 115,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123,
	NUMLOCK: 144,
	SCROLLLOCK: 145,
	SEMICOLON: 186,
	EQUAL: 187,
	COMMA: 188,
	DASH: 189,
	PERIOD: 190,
	FSLASH: 191,
	GRAVE: 192,
	OBRACKET: 219,
	BSLASH: 220,
	CBRACKET: 221,
	QUOTE: 222
}

var Mousecodes = {
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2
}
