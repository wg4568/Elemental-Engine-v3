var Elemental = {};

Elemental.Backend = {
	mousePos: {x: 0, y: 0},
	keyStates: {},
	keysDown: {},
	keysUp: {},
	mouseState: {},
	mouseDown: {},
	mouseUp: {},
	spinoffs: [],
	frameFunctions: []
}

// GameLoopManager By Javier Arevalo
Elemental.Backend.Timer = new function() {
	this.lastTime = 0;
	this.gameTick = null;
	this.prevElapsed = 0;
	this.prevElapsed2 = 0;

	this.start = function(gameTick) {
		var prevTick = this.gameTick;
		this.gameTick = gameTick;
		if (this.lastTime == 0)
		{
			// Once started, the loop never stops.
			// But this function is called to change tick functions.
			// Avoid requesting multiple frames per frame.
			var bindThis = this;
			requestAnimationFrame(function() { bindThis.tick(); } );
			this.lastTime = 0;
		}
	}

	this.stop = function() {
		this.start (null);
	}

	this.tick = function () {
		if (this.gameTick != null)
		{
			var bindThis = this;
			requestAnimationFrame(function() { bindThis.tick(); } );
		}
		else
		{
			this.lastTime = 0;
			return;
		}
		var timeNow = Date.now();
		var elapsed = timeNow - this.lastTime;
		if (elapsed > 0)
		{
			if (this.lastTime != 0)
			{
				if (elapsed > 1000) // Cap max elapsed time to 1 second to avoid death spiral
				elapsed = 1000;
				// Hackish fps smoothing
				var smoothElapsed = (elapsed + this.prevElapsed + this.prevElapsed2)/3;
				this.gameTick(0.001*smoothElapsed);
				this.prevElapsed2 = this.prevElapsed;
				this.prevElapsed = elapsed;
			}
			this.lastTime = timeNow;
		}
	}
}

Elemental.AddLogic = function(func) {
	Elemental.Backend.frameFunctions.push(func);
}

Elemental.Start = function() {
	Elemental.Backend.Timer.start(function(time){
		Elemental.Backend.frameFunctions.forEach(function(func){
			func(time);
		});
		Elemental.Spinoff.RunAll();
		Elemental.Backend.ResetKeys();
	});
}

Elemental.Stop = function() {
	Elemental.Backend.Timer.stop();
}

Elemental.Backend.ResetKeys = function() {
	Elemental.Backend.keysDown = {};
	Elemental.Backend.keysUp = {};
	Elemental.Backend.mouseDown = {};
	Elemental.Backend.mouseUp = {};
}

document.addEventListener("keydown", function(event) {
	if (!Elemental.Input.KeyHeld(event.keyCode)) {
		Elemental.Backend.keysDown[event.keyCode] = 1;
	}
	Elemental.Backend.keyStates[event.keyCode] = 1;
});

document.addEventListener("keyup", function(event) {
	Elemental.Backend.keyStates[event.keyCode] = 0;
	Elemental.Backend.keysUp[event.keyCode] = 1;
});

document.addEventListener("mousedown", function(event) {
	if (!Elemental.Input.MouseHeld(event.button)) {
		Elemental.Backend.mouseDown[event.button] = 1;
	}
	Elemental.Backend.mouseState[event.button] = 1;
});

document.addEventListener("mouseup", function(event) {
	Elemental.Backend.mouseState[event.button] = 0;
	Elemental.Backend.mouseUp[event.button] = 1;
});

Elemental.Canvas = class {
	constructor(id, fullscreen=false) {
		this.canvas = document.getElementById(id);
		this.context = this.canvas.getContext("2d");
		this.fullscreen = fullscreen;

		this.mousePos = Elemental.Vector.Empty;

		this.canvas.addEventListener("contextmenu", event => event.preventDefault());

		var parent = this;
		this.canvas.addEventListener("mousemove", function(event) {
			Elemental.Backend.mousePos = new Elemental.Vector(event.offsetX, event.offsetY);
		});

		if (this.fullscreen) {
			this.fillWindow();
			document.body.style.margin = 0;
			var parent = this;
			window.addEventListener("resize", function(event){
				parent.fillWindow();
			});
		}
	}

	fillWindow() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
	}

	// Getters and setters
	get width() { return this.canvas.width; }
	set width(val) { this.canvas.width = val; }

	get height() { return this.canvas.height; }
	set height(val) { this.canvas.height = val; }

	get center() { return new Elemental.Vector(this.width/2, this.height/2); }

	// Draw functions
	drawFill(color) {
		this.drawRect(color, Elemental.Vector.Empty, this.width, this.height);
	}

	drawLine(p1, p2, color="black", width=1, caps="round") {
		this.context.strokeStyle = Elemental.Helpers.CssColor(color);
		this.context.lineWidth = width;
		this.context.lineCap = caps;

		this.context.beginPath();
		this.context.moveTo(p1.x, p1.y);
		this.context.lineTo(p2.x, p2.y);
		this.context.stroke();
	}

	drawText(font, text, posn, color="black") {
		this.context.fillStyle = Elemental.Helpers.CssColor(color);
		this.context.font = font;
		this.context.fillText(text, posn.x, posn.y);
	}

	drawRect(color, posn, w, h) {
		this.context.fillStyle = Elemental.Helpers.CssColor(color);
		this.context.fillRect(posn.x, posn.y, w, h);
	}

	drawImage(image, posn, scale=1) {
		this.context.drawImage(image, posn.x, posn.y, image.width*scale, image.height*scale);
	}

	drawSprite(sprite, posn) {
		sprite.drawOnCanvas(this, posn);
	}
}

Elemental.Input = class {
	static get MousePos() {
		return Elemental.Backend.mousePos;
	}

	static KeyHeld(keycode) {
		var val = Elemental.Backend.keyStates[keycode];
		if (val == 1) { return true; }
		else { return false; }
	}

	static KeyPressed(keycode) {
		var val = Elemental.Backend.keysDown[keycode];
		if (val == 1) { return true; }
		else { return false; }
	}

	static KeyReleased(keycode) {
		var val = Elemental.Backend.keysUp[keycode];
		if (val == 1) { return true; }
		else { return false; }
	}

	static MouseHeld(button) {
		var val = Elemental.Backend.mouseState[button];
		if (val == 1) { return true; }
		else { return false; }
	}

	static MousePressed(button) {
		var val = Elemental.Backend.mouseDown[button];
		if (val == 1) { return true; }
		else { return false; }
	}

	static MouseReleased(button) {
		var val = Elemental.Backend.mouseUp[button];
		if (val == 1) { return true; }
		else { return false; }
	}
}

// Sprite class, and all extension classes
Elemental.Sprite = class {
	constructor() {
		this.layer = 0;
		this.scale = 1;
		this.center = Elemental.Vector.Empty;
		this.rotation = 0;
		this.alpha = 1;
	}

	drawOnCanvas(canvas, posn) {
		//pass
	}

	inherit(data) {
		for (var property in data) {
			if (data.hasOwnProperty(property)) {
				this[property] = data[property]
			}
		}
	}
}

Elemental.Sprite.Points = class extends Elemental.Sprite {
	constructor(points, config={}) {
		super();

		this.points = points;

		this.lineWidth = 1;
		this.lineColor = "black";
		this.lineCaps = "round";
		this.lineCorners = "round";
		this.lineMiterLimit = null;
		this.lineDashWidth = null;
		this.lineDashSpacing = null;

		this.fillColor = "white";
		this.closePath = true;
		this.strokeFirst = false;

		this.inherit(config);
	}

	drawOnCanvas(canvas, posn) {
		canvas.context.strokeStyle = Elemental.Helpers.CssColor(this.lineColor);
		canvas.context.lineWidth = this.lineWidth;
		canvas.context.lineCap = this.lineCaps;
		canvas.context.lineJoin = this.lineCorners;
		canvas.context.miterLimit = this.lineMiterLimit;
		canvas.context.setLineDash([this.lineDashWidth, this.lineDashSpacing]);
		canvas.context.lineDashOffset = this.lineDashOffset;
		canvas.context.fillStyle = Elemental.Helpers.CssColor(this.fillColor);

		canvas.context.translate(posn.x, posn.y);
		canvas.context.rotate(Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.globalAlpha = this.alpha;

		canvas.context.beginPath();

		canvas.context.moveTo(
			(this.points[0].x-this.center.x)*this.scale,
			(this.points[0].y-this.center.y)*this.scale
		);
		for (var i=1; i<this.points.length; i++) {
			canvas.context.lineTo(
				(this.points[i].x-this.center.x)*this.scale,
				(this.points[i].y-this.center.y)*this.scale
			);
		}

		if (this.closePath) {
			canvas.context.closePath();
		}

		if (this.strokeFirst) {
			if (this.lineWidth > 0) { canvas.context.stroke(); }
			canvas.context.fill();
		} else {
			canvas.context.fill();
			if (this.lineWidth > 0) { canvas.context.stroke(); }
		}

		canvas.context.globalAlpha = 1;0
		canvas.context.rotate(-Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.translate(-posn.x, -posn.y);
	}
}

Elemental.Sprite.Polygon = class extends Elemental.Sprite {
	constructor(sides, size, config={}) {
		super();

		this.size = size;
		this.sides = sides;

		this.lineWidth = 1;
		this.lineColor = "black";
		this.lineCaps = "round";
		this.lineCorners = "round";
		this.lineMiterLimit = null;
		this.lineDashWidth = null;
		this.lineDashSpacing = null;

		this.fillColor = "white";
		this.strokeFirst = false;

		this.inherit(config);
	}

	drawOnCanvas(canvas, posn) {
		canvas.context.strokeStyle = Elemental.Helpers.CssColor(this.lineColor);
		canvas.context.lineWidth = this.lineWidth;
		canvas.context.lineCap = this.lineCaps;
		canvas.context.lineJoin = this.lineCorners;
		canvas.context.miterLimit = this.lineMiterLimit;
		canvas.context.setLineDash([this.lineDashWidth, this.lineDashSpacing]);
		canvas.context.lineDashOffset = this.lineDashOffset;
		canvas.context.fillStyle = Elemental.Helpers.CssColor(this.fillColor);

		canvas.context.translate(posn.x, posn.y);
		canvas.context.rotate(Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.globalAlpha = this.alpha;

		canvas.context.beginPath();
		canvas.context.moveTo(
			(this.size-this.center.x)*this.scale,
			-this.center.y*this.scale
		);

		for (var angle = 360/this.sides; angle < 360; angle += 360/this.sides) {
				canvas.context.lineTo(
					((Math.cos(Elemental.Helpers.ToRadians(angle))*this.size)-this.center.x)*this.scale,
					((Math.sin(Elemental.Helpers.ToRadians(angle))*this.size)-this.center.y)*this.scale
				);
		}

		canvas.context.closePath();

		if (this.strokeFirst) {
			if (this.lineWidth > 0) { canvas.context.stroke(); }
			canvas.context.fill();
		} else {
			canvas.context.fill();
			if (this.lineWidth > 0) { canvas.context.stroke(); }
		}

		canvas.context.globalAlpha = 1;
		canvas.context.rotate(-Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.translate(-posn.x, -posn.y);
	}
}

Elemental.Sprite.Ellipse = class extends Elemental.Sprite {
	constructor(size, config={}) {
		super();

		this.radius = size;
		this.start = 0;
		this.end = 360;
		this.midpoint = Elemental.Vector.Empty;
		this.lineWidth = 1;
		this.lineColor = "black";
		this.lineCaps = "round";
		this.lineCorners = "round";
		this.lineMiterLimit = null;
		this.lineDashWidth = null;
		this.lineDashSpacing = null;

		this.fillColor = "white";
		this.closePath = true;
		this.strokeFirst = false;

		this.inherit(config);
	}

	drawOnCanvas(canvas, posn) {
		canvas.context.strokeStyle = Elemental.Helpers.CssColor(this.lineColor);
		canvas.context.lineWidth = this.lineWidth;
		canvas.context.lineCap = this.lineCaps;
		canvas.context.lineJoin = this.lineCorners;
		canvas.context.miterLimit = this.lineMiterLimit;
		canvas.context.setLineDash([this.lineDashWidth, this.lineDashSpacing]);
		canvas.context.lineDashOffset = this.lineDashOffset;
		canvas.context.fillStyle = Elemental.Helpers.CssColor(this.fillColor);

		canvas.context.translate(posn.x, posn.y);
		canvas.context.rotate(Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.globalAlpha = this.alpha;

		canvas.context.beginPath();

		canvas.context.arc(
			(this.midpoint.x-this.center.x)*this.scale,
			(this.midpoint.y-this.center.y)*this.scale,
			(this.radius)*this.scale,
			Elemental.Helpers.ToRadians(this.start),
			Elemental.Helpers.ToRadians(this.end)
		);

		if (this.closePath) {
			canvas.context.closePath();
		}

		if (this.strokeFirst) {
			if (this.lineWidth > 0) { canvas.context.stroke(); }
			canvas.context.fill();
		} else {
			canvas.context.fill();
			if (this.lineWidth > 0) { canvas.context.stroke(); }
		}

		canvas.context.globalAlpha = 1;
		canvas.context.rotate(-Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.translate(-posn.x, -posn.y);
	}
}

Elemental.Sprite.Image = class extends Elemental.Sprite {
	constructor(image, config={}) {
		super();

		this.image = Elemental.Helpers.LoadImage(image);

		this.inherit(config);
	}

	get width() { return this.image.width*this.scale; }
	get height() { return this.image.height*this.scale; }
	get size() { return new Elemental.Vector(this.height, this.width); }

	drawOnCanvas(canvas, posn) {
		canvas.context.translate(posn.x, posn.y);
		canvas.context.rotate(Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.globalAlpha = this.alpha;

		canvas.drawImage(this.image, Elemental.Vector.Inverse(this.center), this.scale);

		canvas.context.globalAlpha = 1;
		canvas.context.rotate(-Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.translate(-posn.x, -posn.y);
	}
}

Elemental.Sprite.Composite = class extends Elemental.Sprite {
	constructor(shapes, config={}) {
		super();

		this.shapes = shapes;

		this.inherit(config);
	}

	drawOnCanvas(canvas, posn) {
		var scale = this.scale;
		var negCent = Elemental.Vector.Inverse(this.center);
		canvas.context.translate(posn.x, posn.y);
		canvas.context.rotate(Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.globalAlpha = this.alpha;

		this.shapes.sort(function(a, b){
			if (a.layer > b.layer) return 1;
			if (a.layer < b.layer) return -1;
			return 0;
		});

		this.shapes.forEach(function(shape){
			shape.scale *= scale;
			shape.drawOnCanvas(canvas, negCent);
			shape.scale /= scale;
		});

		canvas.context.globalAlpha = 1;
		canvas.context.rotate(-Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.translate(-posn.x, -posn.y);
	}
}

Elemental.Sprite.Animation = class extends Elemental.Sprite {
	constructor(frames, speed, config={}) {
		super();

		this.frames = frames;
		this.speed = speed;
		this.currentframe = 0;
		this.framecount = 0;
	}

	drawOnCanvas(canvas, posn) {
		this.framecount++;

		if (this.framecount >= this.speed) {
			this.framecount = 0;
			this.currentframe = (this.currentframe + 1) % this.frames.length;
		}
		canvas.context.translate(posn.x, posn.y);
		canvas.context.rotate(Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.globalAlpha = this.alpha;

		this.frames[this.currentframe].drawOnCanvas(canvas, Elemental.Vector.Inverse(this.center));

		canvas.context.globalAlpha = 1;
		canvas.context.rotate(-Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.translate(-posn.x, -posn.y);
	}
}

Elemental.Audio = null;

Elemental.Spinoff = class {
	constructor(duration, unique=false) {
		this.duration = duration;
		this.unique = unique;
		this.frame = 0;
		this.returning = false;

		this.running = false;

		this.funcStart = function(){}
		this.funcFrame = function(){}
		this.funcEnd = function(){}
		this.funcReturn = null;
	}

	onStart(func) { this.funcStart = func; }
	onFrame(func) { this.funcFrame = func; }
	onEnd(func) { this.funcEnd = func; }
	onReturn(func) { this.funcReturn = func; }

	end() {
		this.funcEnd();
		this.returning = false;
		this.running = false;
		this.frame = 0;
		var ind = Elemental.Backend.spinoffs.indexOf(this);
		if (ind != -1) {
			Elemental.Backend.spinoffs.splice(ind, 1);
		}
	}

	start() {
		if (this.unique) {
			if (!this.running) {
				Elemental.Backend.spinoffs.push(this);
			}
		} else {
			Elemental.Backend.spinoffs.push(this);
		}
		this.running = true;
	}

	doFrame() {
		if (this.frame == 0) { this.funcStart(); }

		if (this.returning) { this.funcReturn((this.duration*2)-this.frame-1); }
		else { this.funcFrame(this.frame); }

		this.frame++;

		if (this.funcReturn != null) {
			if (this.frame >= this.duration) {
				this.returning = true;
			}
			if (this.frame >= this.duration * 2) {
				this.end();
			}
		} else {
			if (this.frame >= this.duration) {
				this.end();
			}
		}
	}

	static RunAll() {
		Elemental.Backend.spinoffs.forEach(function(so){
			so.doFrame();
		});
	}
}

Elemental.Color = class {
	constructor() {
		this._red = 0;
		this._green = 0;
		this._blue = 0;

		if (arguments.length == 1) {
			this.parseFrom(arguments[0]);
		} else {
			this._red = arguments[0];
			this._green = arguments[1];
			this._blue = arguments[2];
		}
	}

	get red() { return this._red; }
	get green() { return this._green; }
	get blue() { return this._blue; }

	set red(val) { this._red = Elemental.Helpers.Constrict(val, 0, 255); }
	set green(val) { this._green = Elemental.Helpers.Constrict(val, 0, 255); }
	set blue(val) { this._blue = Elemental.Helpers.Constrict(val, 0, 255); }

	cssColor() {
		return `rgb(${this.red}, ${this.green}, ${this.blue})`
	}

	parseFrom(string) {
		var array = string.substring(4, string.length-1).replace(/ /g, '').split(',');
		array = array.map(function(x) { return parseInt(x) });
		this._red = array[0];
		this._green = array[1];
		this._blue = array[2];
	}

	static IsColor(color) {
		return color instanceof Elemental.Color;
	}
}

// Helper object filled with helper functions and classes
Elemental.Helpers = {}

Elemental.Helpers.ToRadians = function(degrees) {
	return degrees * Math.PI / 180;
}

Elemental.Helpers.ToDegrees = function(radians) {
	return radians * 180 / Math.PI;
}

Elemental.Helpers.AngleBetween = function(point1, point2) {
	var rads = Math.atan2(point1.x-point2.x, point1.y-point2.y);
	return -Elemental.Helpers.ToDegrees(rads)+90;
}

Elemental.Helpers.DistanceBetween = function(point1, point2) {
	return Math.sqrt(Math.pow(point1.x-point2.x, 2) + Math.pow(point1.y-point2.y, 2));
}

Elemental.Helpers.StepBetween = function(point1, point2) {
	var hype = Elemental.Helpers.DistanceBetween(point1, point2);
	var dx = (point1.x-point2.x)/hype;
	var dy = (point1.y-point2.y)/hype;
	return new Elemental.Vector(dx, dy);
}

Elemental.Helpers.RandomInt = function(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

Elemental.Helpers.RandomColor = function(r={min: 0, max: 255}, g={min: 0, max: 255}, b={min: 0, max: 255}) {
	var r = Elemental.Helpers.RandomInt(r.min, r.max);
	var g = Elemental.Helpers.RandomInt(g.min, g.max);
	var b = Elemental.Helpers.RandomInt(b.min, b.max);
	return `rgb(${r}, ${g}, ${b})`;
}

Elemental.Helpers.LoadImage = function(url) {
	var img = new Image();
    img.src = url;
	return img;
}

Elemental.Helpers.Now = function() {
	return new Date().getTime() / 1000;
}

Elemental.Helpers.Constrict = function(val, min, max) {
	if (val < min) { return min; }
	if (val > max) { return max; }
	else { return val; }
}

Elemental.Helpers.CssColor = function(color) {
	if (Elemental.Color.IsColor(color)) {
		return color.cssColor();
	} else {
		return color;
	}
}

// Vector class and function definitions
Elemental.Vector = class {
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
Elemental.Keycodes = {
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

Elemental.Mousecodes = {
	LEFT: 0,
	MIDDLE: 1,
	RIGHT: 2
}
