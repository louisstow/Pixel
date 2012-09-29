var offscreen = null;
var offscreenCtx = null;
var dirtyBuffer = true;

/**
* 1. Draw the image data onto offscreen buffer
* 2. Draw buffer to canvas at zoom level
*/

function updateBuffer() {
	offscreen.width = canvasWidth;
	offscreen.height = canvasHeight;

	var imgdata = offscreenCtx.getImageData(0, 0, canvasWidth, canvasHeight);
	var color;
	var pixel;
	var index;
	var data = imgdata.data;
	var coord;
	var owner = mypixelsSelected && me.userID;

	//loop over board
	for(var pos in board) {
		pixel = board[pos];
		//skip if only drawing owner
		if(owner && pixel.owner != owner) continue;
		
		coord = pos.split(",");
        if(coord.length !== 2) continue;

		index = (coord[1] * canvasWidth + (+coord[0])) * 4;
		color = pixel.color;
		
		data[index] = parseInt(color.substr(0, 2), 16);   //red
		data[++index] = parseInt(color.substr(2, 2), 16); // green
		data[++index] = parseInt(color.substr(4, 2), 16); // blue
		data[++index] = 255;
	}
	
	//loop over selected pixels
	for(var pos in pixels) {
		pixel = board[pos];
		if(owner && !pixel) continue;
		if(owner && pixel.owner != owner) continue;
		
		coord = pos.split(",");
		if(coord.length !== 2) continue;

		index = (coord[1] * canvasWidth + (+coord[0])) * 4;

		var sr = parseInt(selectColorHex.substr(0, 2), 16),
			sg = parseInt(selectColorHex.substr(2, 2), 16),
			sb = parseInt(selectColorHex.substr(4, 2), 16);

		if(!pixel) {
			data[  index] = sr;   //red
			data[++index] = sg; // green
			data[++index] = sb; // blue
			data[++index] = 127;
		} else {
			var other = pixel.color;
			var r = parseInt(other.substr(0, 2), 16) / 255;
			var g = parseInt(other.substr(2, 2), 16) / 255;
			var b = parseInt(other.substr(4, 2), 16) / 255;
			sr /= 255;
			sg /= 255;
			sb /= 255;

			data[  index] = ((r * .5 + sr * .5) * 255) | 0;
			data[++index] = ((g * .5 + sg * .5) * 255) | 0;
			data[++index] = ((b * .5 + sb * .5) * 255) | 0;
			data[++index] = 255;
		}
		
	}

	offscreenCtx.putImageData(imgdata, 0, 0);
	dirtyBuffer = false;
}

function drawZoom(startX, startY, zoom) {
	zoomPos.left = startX;
	zoomPos.top = startY;
	zoomLevel = zoom;

	ctx.clearRect(0, 0, canvasWidth, canvasHeight);

	var zoomWidth = canvasWidth / zoom | 0;
	var zoomHeight = canvasHeight / zoom | 0;

	$("a.zoomlevel").text(zoomLevel);

	var offsetX = startX - (startX | 0);
	var offsetY = startY - (startY | 0);

	ctx.drawImage(
		offscreen, 
		startX | 0, 
		startY | 0,
		zoomWidth + 1,
		zoomHeight + 1,
		offsetX * -zoom,
		offsetY * -zoom,
		canvasWidth + zoom,
		canvasHeight + zoom
	);
}

function drawBoard() {
	zoomPos.left = 0;
	zoomPos.top = 0;
	zoomLevel = 1;
	return drawZoom(0, 0, 1);
}

function redraw() {
	if(pixels.length) {
		$counter.show().text("(" + pixels.length + ")");
	} else {
		$counter.hide();
	}

	if(dirtyBuffer) {
		updateBuffer();
	}
	
	drawZoom(zoomPos.left, zoomPos.top, zoomLevel);
}

function updateBoard(data) {
	currentTimestamp = data.substr(0, 13);
	parse = data.substr(13);
	var len = parse.length;
	var x = 0, y = 0;
	var params = {};
	var ownr = {};
	
	for(var i = 0; i < len; i++) {
		if(parse.charAt(i) === '') break;

		if(x == 1200) {
			x = 0;
			y++;
		}

		if(parse.charAt(i) === '.') {
			x++;
			
			continue;
		}
		
		var key = x + "," + y;
		
		if(!board[key]) {
			board[key] = {};
		}
		
		board[key].color = parse.substr(i, 6);
		board[key].cost = parseInt(parse.substr(i + 6, 3), 16);
		board[key].owner = parseInt(parse.substr(i + 9, 4), 16);
		
		if(!owners[board[key].owner]) ownr[board[key].owner] = true;
		
		x++;
		i += 12;
	}
	
	//convert owners object to param array
	params.owners = [];
	for(var id in ownr) {
		if(!ownr.hasOwnProperty(id) || !ownr[id]) continue;
		params.owners.push(+id);
	}
	
	//grab the information about owners
	if(params.owners && params.owners.length)
		api("GetUsers", params, getUsers);
	
	dirtyBuffer = true;
	redraw();
}

function applyLogs(logs) {
	if(!logs) return;
	dirtyBuffer = true;
	
	//log too big, refresh page
	if(log == ".") {
		window.location.reload();
		return;
	}
	
	var logs = logs.split('\n'),
		i = 0, len = logs.length,
		log, o,
		ownr = {},
		param = {};
	
	//split the logs on newline
	for(;i < len; ++i) {
		log = logs[i];
		if(!log) continue;
		
		var opts = log.split(' ');
		var pixels = opts[0].split('|');
		
		//loop over pixels
		for(var p = 0; p < pixels.length; ++p) {
			var pixel = pixels[p];
			
			//delete pixel
			if(opts[1] == 'd') {
				delete board[pixel];
				continue;
			}
			
			//init if not exists
			if(!board[pixel]) {
				board[pixel] = {};
			}
			
			//update the board
			if(opts[2] != '.') board[pixel].color = opts[2];
			if(opts[3] != '.') board[pixel].cost = parseInt(opts[3], 16);
			if(opts[4] != '.') board[pixel].owner = parseInt(opts[4], 16);
			o = board[pixel].owner;
			
			//if we dont know about this owner, get it
			if(o && (!owners[o] && !ownr[o])) {
				ownr[o] = true;
			}
		}
	}
	
	param.owners = [];
	for(var ow in ownr) {
		if(!ownr.hasOwnProperty(ow) || !ownr[ow]) continue;
		param.owners.push(ow);
	}
	
	redraw();
	if(param.owners && param.owners.length)
		api("GetUsers", param, getUsers);
}
