var Elemental = {};

Elemental.Canvas = class {
	constructor(id, fullscreen=false) {
		this.canvas = document.getElementById(id);
		this.context = this.canvas.getContext("2d");
		this.fullscreen = fullscreen;

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
		this.context.strokeStyle = color;
		this.context.lineWidth = width;
		this.context.lineCap = caps;

		this.context.beginPath();
		this.context.moveTo(p1.x, p1.y);
		this.context.lineTo(p2.x, p2.y);
		this.context.stroke();
	}

	drawText(font, text, posn, color="black") {
		this.context.fillStyle = color;
		this.context.font = font;
		this.context.fillText(text, posn.x, posn.y);
	}

	drawRect(color, posn, w, h) {
		this.context.fillStyle = color;
		this.context.fillRect(posn.x, posn.y, w, h);
	}

	drawImage(image, posn, scale=1) {
		this.context.drawImage(image, posn.x, posn.y, image.width*scale, image.height*scale);
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
		canvas.context.strokeStyle = this.lineColor;
		canvas.context.lineWidth = this.lineWidth;
		canvas.context.lineCap = this.lineCaps;
		canvas.context.lineJoin = this.lineCorners;
		canvas.context.miterLimit = this.lineMiterLimit;
		canvas.context.setLineDash([this.lineDashWidth, this.lineDashSpacing]);
		canvas.context.lineDashOffset = this.lineDashOffset;
		canvas.context.fillStyle = this.fillColor;

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

		canvas.context.globalAlpha = 1;
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

		this.fillColor = null;
		this.strokeFirst = false;

		this.inherit(config);
	}

	drawOnCanvas(canvas, posn) {
		canvas.context.strokeStyle = this.lineColor;
		canvas.context.lineWidth = this.lineWidth;
		canvas.context.lineCap = this.lineCaps;
		canvas.context.lineJoin = this.lineCorners;
		canvas.context.miterLimit = this.lineMiterLimit;
		canvas.context.setLineDash([this.lineDashWidth, this.lineDashSpacing]);
		canvas.context.lineDashOffset = this.lineDashOffset;
		canvas.context.fillStyle = this.fillColor;

		canvas.context.translate(posn.x, posn.y);
		canvas.context.rotate(Elemental.Helpers.ToRadians(this.rotation));
		canvas.context.globalAlpha = this.alpha;

		canvas.context.beginPath();
		canvas.context.moveTo(
			(this.size-this.center.x)*this.scale,
			this.center.y*this.scale
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
		canvas.context.strokeStyle = this.lineColor;
		canvas.context.lineWidth = this.lineWidth;
		canvas.context.lineCap = this.lineCaps;
		canvas.context.lineJoin = this.lineCorners;
		canvas.context.miterLimit = this.lineMiterLimit;
		canvas.context.setLineDash([this.lineDashWidth, this.lineDashSpacing]);
		canvas.context.lineDashOffset = this.lineDashOffset;
		canvas.context.fillStyle = this.fillColor;

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

// GameLoopManager By Javier Arevalo
Elemental.Helpers.GameLoopManager = new function() {
	this.lastTime = 0;
	this.gameTick = null;
	this.prevElapsed = 0;
	this.prevElapsed2 = 0;

	this.run = function(gameTick) {
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
		this.run(null);
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
