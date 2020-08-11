var TILE_SIZE = 32;

var current_board;
var keys_pressed = [];
var cam = {
	x: 0,
	y: 0
};
var draggingInfo = {};
var boards = [];

var player = {
	x: 0,
	y: 0,
	board: 0,
	t: 0,
	level: -1,
};

var levels;

function setupAll() {
	/////////////////////TILES/////////////////////////
	TILE_EMPTY = Tile({
		walkable: true,
		render: (b, x, y) => {
			fill(255, 255, 255);
			rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		}
	});

	TILE_PLAYER = Tile({
		render: (board, x, y) => {
			fill(255, 0, 0);
			circle(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, TILE_SIZE);
		}
	});

	TILE_WIN = (tile) => Tile({
		render: (board, x, y) => {
			fill(255, 255, 0);
			rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		},
		onSpacialHit: (board, x, y) => {
			nextLevel();
		},
		onTemporalHit: (board, x, y) => {
			nextLevel();
		},
		step: (board, x, y) => {
			board.setTile(x, y, tile);
		}
	});

	TILE_WALL = Tile({
		render: (board, x, y) => {
			fill(25, 25, 80);
			rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		},
		step: (board, x, y) => {
			if (board.getTile(x, y - 1) == TILE_WALL || (board.getTile(x, y - 1) == TILE_PLAYER && board.getTile(x-1, y) == TILE_EMPTY) ) {
				board.setTile(x, y, TILE_EMPTY);
			}
		}
	});


	//Replaces itself with the tile specified after one step.
	TILE_GEN = (tile, color) => Tile({
		walkable: true,
		render: (board, x, y) => {
			fill(color);
			rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		},
		step: (board, x, y) => {
			board.setTile(x, y, tile);
		}
	});

	TILE_MOVEMENT = (dx,dy,dt,color) => Tile({
		render: (board, x, y) => {
			fill(color);
			rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		},
		onTemporalHit: (board, x, y) => {
			movePlayer(player, dx, dy, dt);
		},
		step: (board, x, y) => {
			board.setTile(x, y, TILE_EMPTY);
		},
		causesStep: false
	});
	
	TILE_GEN_R = (tile, color, n) => n <= 1 ? TILE_GEN(tile, color) : TILE_GEN(TILE_GEN_R(tile, color, n-1), color);

	TILE_PAST = TILE_MOVEMENT(0,0,-2, color(100,255,100));
	
	//Next turn wall.
	TILE_WALL_NT = TILE_GEN(TILE_WALL, color(255,255,255));
	
	levels = [{
		name: "Main menu",
		draw: () => {
			push();
				background(100);
				
				fill(50,50,200);
				rect(32,32,(width-64),(height-64));
				textAlign(CENTER)
				
				fill(0);
				textSize(20);
				text("Welcome to a fictional time? travel? puzzle!!\n" +
					"The controls are WASD to move in space,\n" +
					"Q to move one to the past in time.\n R to restart level\n" + 
					"Experiment around to figure out how everything works.\n" +
					"Touch the yellow block to win and progress to the next level.\n" +
					"\n\n\nClick space to start the game!", width/2, height/2 -120);
				if(key == " ")
					nextLevel();
			pop();
		}
	}, {
		name: "Introduction",
		size: 4,
		background: loadImage('imgs/cats.png'),
		map: [
			TILE_PLAYER, TILE_WALL, TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY, TILE_WALL, TILE_EMPTY, TILE_EMPTY,
			TILE_WALL, TILE_WALL, TILE_EMPTY, TILE_EMPTY,
			TILE_WIN(TILE_EMPTY), TILE_WALL, TILE_EMPTY, TILE_EMPTY,
		]
	}, {
		name: "Walls break",
		size: 5,
		background: loadImage('imgs/walls.png'),
		map: [
			TILE_PLAYER, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_WALL, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_GEN(TILE_WIN(TILE_EMPTY), color(255, 255, 255)), TILE_WALL, TILE_EMPTY, TILE_EMPTY,  TILE_EMPTY,
			TILE_GEN(TILE_WALL, color(255, 255, 255)), TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,  TILE_EMPTY,
		]
	}, {
		name: "Puzzle",
		size: 4,
		map: [
			TILE_PLAYER, TILE_EMPTY, TILE_GEN(TILE_GEN(TILE_WALL, color(255,255,255)), color(255,255,255)), TILE_WALL,
			TILE_EMPTY,TILE_EMPTY, TILE_WIN(TILE_WALL),TILE_WALL,
			TILE_EMPTY,TILE_EMPTY,TILE_EMPTY,TILE_WALL,
			TILE_WALL,TILE_WALL,TILE_WALL,TILE_WALL,
		]
	}, {
		name: "To the past twice we go",
		size: 7,
		background: loadImage('imgs/twice into the past.png'),
		map: [
			TILE_PLAYER,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_GEN_R(TILE_WALL, color(255,255,255), 3), TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_GEN_R(TILE_WALL, color(255,255,255), 3),  TILE_GEN_R(TILE_WIN(TILE_PAST), color(255,255,255), 2), TILE_GEN_R(TILE_WALL, color(255,255,255), 3), TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_GEN_R(TILE_WALL, color(255,255,255), 3), TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY, TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
		]
	}, {
		name: "Hard puzzle",
		size: 6,
		map: [
			TILE_PLAYER,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY, TILE_EMPTY, TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY, TILE_EMPTY, TILE_WALL_NT,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY, TILE_WALL_NT, TILE_WALL,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_WALL_NT, TILE_WALL, TILE_GEN(TILE_WIN(TILE_WALL), color(255,255,255)),
		]
	}, {
		name: "END GAME SCREEN",
		draw: () => {
			push();
				background(100);
				
				fill(50,50,200);
				rect(32,32,(width-64),(height-64));
				textAlign(CENTER)
				
				fill(0);
				textSize(24);
				text("Yay you won, now go enjoy life c:", width/2, height/2);
			pop();
		}
	}];
}

/*
{
		name: "Better puzzle",
		size: 4,
		map: [
			TILE_PLAYER,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,
			TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,  TILE_EMPTY,
		]
	}
*/

///////////////////////////////////
function nextLevel() {
	print("LEVEL START");
	player.level++;

	var level = levels[player.level];
	if (level != null) {
		boards = [];
		player.x = player.y = player.t = 0;
		cam.x = player.x - width/2;
		cam.y = player.y - height/2;
		if (level.map != null) {
			player.board = new Board(level.size, level.size);
			for(var i = 0; i < level.map.length; i++)
				player.board.map[i] = level.map[i];
			boards.push(player.board);
		}
		if (level.init != null) level.init();
		player.levelObj = level;
	} else {
		print("AAAH CANT FIND THE NEXT LEVEL, PLS CONTACT AUTHOR OF GAME waleedalqalaf.itch.io")
	}
}

///////////////////////////////////
function setup() {
	createCanvas(600, 600);
	setupAll();
	nextLevel();
}

function draw() {
	cam.offsetX = player.board.sizeX * TILE_SIZE / 2 - width / 2;
	cam.y = -height / 2 + player.board.sizeY * TILE_SIZE / 2;

	if (!(draggingInfo.dragging || cam.reachedTarget) && abs(player.board.x + cam.offsetX - cam.x) > 4) {
		cam.x += (player.board.x + cam.offsetX) > cam.x ? 6 : -6;
	} else {
		cam.reachedTarget = true;
	}
	if(player.levelObj.draw != null) {
		player.levelObj.draw();
	} else {
		push();
			background(100);
			if(player.levelObj.background != null)
				image(player.levelObj.background, 0, 0);
			translate(-cam.x, -cam.y);
			boards.forEach((board) => board.render());
			fill(0, 200, 0);
			circle(player.board.x + (player.x + 0.5) * TILE_SIZE, player.board.y +  (player.y + 0.5) * TILE_SIZE, TILE_SIZE);
		pop();
		
		push();
			fill(0);
			textSize(12);
			text("Level: " + (player.level) + "/" + 5, 32, 32);
		pop();
	}
}

/////////////////////////////////////////////
function keyPressed() {
	if (keyCode == 87)		//W
		movePlayer(player,0,-1,1);
	else if (keyCode == 83)	//S
		movePlayer(player,0,1,1);
	else if (keyCode == 65)	//A
		movePlayer(player,-1,0,1);
	else if (keyCode == 68)	//D
		movePlayer(player,1,0,1);
	else if (keyCode == 81)	//Q PAST
		movePlayer(player,0,0,-1);
	else if(keyCode == 82) {
		player.level--;
		nextLevel();
	}
}

function movePlayer(player, dx, dy, dt) {
	var x = player.x;
	var y = player.y;
	var t = player.t;
	player.t += dt;
	if (player.t < 0) {
		player.t = t;
		return false;
	}
	player.x += dx;
	player.y += dy;
	
	var board;
	if (boards[player.t] == null) {
		board = player.board;
	}
	else {
		board = boards[player.t];
	}
	var spacialHit = !board.freeTile(player.x, player.y);
	var temporalHit = (boards[player.t] != null && !boards[player.t].freeTile(player.x, player.y));
	if (spacialHit || temporalHit) {
		var hitX = player.x;
		var hitY = player.y;
		var hitT = player.t;
		player.x = x;
		player.y = y;
		player.t = t;
		if (hitT == t + 1 && spacialHit && board.withinBounds(hitX, hitY)) {
			board.getTile(hitX, hitY).onSpacialHit(board, hitX, hitY);
		}
		else if (temporalHit && boards[hitT].withinBounds(hitX, hitY)) {
			boards[hitT].getTile(hitX, hitY).onTemporalHit(board, hitX, hitY);
		}
		return false;
	}
	else {
		var tileHit = board.getTile(player.x, player.y);
		if (t == boards.length - 1) {
			player.board = player.board.clone();
			player.board.x += TILE_SIZE * player.board.sizeX + 16;
			player.board.setTile(x, y, TILE_EMPTY);
			boards.push(player.board);
		}
		if (player.t != boards.length)
			player.board = boards[player.t];
		
		if(tileHit.causesStep)
			player.board.step();
		player.board.setTile(player.x, player.y, TILE_PLAYER);
		cam.reachedTarget = false;
	}
	return true;
}

function mousePressed() {
	draggingInfo.x = mouseX;
	draggingInfo.y = mouseY;
	draggingInfo.camX = cam.x;
	draggingInfo.dragging = true;
}

function mouseDragged() {
	if (draggingInfo.dragging) {
		cam.x = draggingInfo.camX + draggingInfo.x - mouseX;
	}
}

function mouseReleased() {
	draggingInfo.dragging = false;
}

//////////////////CLASSES/////////////////

class Board {
	constructor(sizeX, sizeY) {
		this.map = [];
		this.sizeX = sizeX;
		this.sizeY = sizeY;

		this.x = 0;
		this.y = 0;

		for (var i = 0; i < sizeX * sizeY; i++)
			this.map[i] = TILE_EMPTY;
	}

	clone() {
		var board = new Board(this.sizeX, this.sizeY);
		board.x = this.x;
		board.y = this.y;
		for (var i = 0; i < this.map.length; i++)
			board.map[i] = this.map[i];
		return board;
	}

	setTile(x, y, value) {
		this.map[this.toBoardIndex(x, y)] = value;
	}

	getTile(x, y) {
		return this.map[this.toBoardIndex(x, y)];
	}

	toBoardIndex(x, y) {
		if (x >= this.sizeX || x < 0) return -1;
		return x + y * this.sizeX;
	}

	withinBounds(x, y) {
		return 0 <= x && x < this.sizeX && 0 <= y && y < this.sizeY;
	}

	forEach(f) {
		var x = 0;
		var y = 0;
		var i = 0;
		while (true) {
			f(x, y, i);
			x++;
			if (x >= this.sizeX) {
				x = 0;
				y++;
			}
			if (y >= this.sizeY) break;
			i++;
		}
	}

	render() {
		push();
		translate(this.x, this.y);
		this.forEach((x, y, i) => this.map[i].render(this, x, y));
		pop();
	}

	step() {
		this.forEach((x, y, i) => this.map[i].step(this, x, y));
	}

	moveTile(x1, y1, x2, y2) {
		return this.moveTileToBoard(this, x1, y1, x2, y2);
	}

	moveTileToBoard(b, x1, y1, x2, y2) {
		if (!(this.withinBounds(x1, y1) && this.withinBounds(x2, y2)))
			return false;
		if (b.freeTile(x2, y2)) {
			b.setTile(x2, y2, this.getTile(x1, y1));
			this.setTile(x1, y1, TILE_EMPTY);
			return true;
		}
		return false;
	}

	freeTile(x, y) {
		var tile = this.getTile(x, y);
		return tile != null && tile.walkable;
	}
}

function Tile(props) {
	var emptyFunc = () => {};

	function optional(p, _default) {
		return p == null ? _default : p;
	}
	
	function optionalf(p) {
		return optional(p, emptyFunc);
	}
	
	return {
		render: optionalf(props.render),
		step: optionalf(props.step),
		onSpacialHit: optionalf(props.onSpacialHit),
		onTemporalHit: optionalf(props.onTemporalHit),
		walkable: optional(props.walkable, false),
		causesStep: optional(props.causesStep, true)
	}
}