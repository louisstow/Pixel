
function drawBoard(owner) {
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	var imgdata = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	var color;
	var pixel;
	var index;
	var data = imgdata.data;

	owner = owner || mypixelsSelected && me.userID;

	if(window.localStorage) {
		window.localStorage["viewport"] = zoomPos.left + "," + zoomPos.top + "," + zoomLevel;
	}
	
	//loop over board
	for(var pos in board) {
		pixel = board[pos];
		//skip if only drawing owner
		if(owner && pixel.owner != owner) continue;
		
		pos = pos.split(",");
		index = (pos[1] * canvasWidth + (+pos[0])) * 4;
		color = pixels[pos] ? selectColor : pixel.color;
		
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
		
		pos = pos.split(",");
		index = (pos[1] * canvasWidth + (+pos[0])) * 4;
	
		data[index] = parseInt(selectColor.substr(0, 2), 16);   //red
		data[++index] = parseInt(selectColor.substr(2, 2), 16); // green
		data[++index] = parseInt(selectColor.substr(4, 2), 16); // blue
		data[++index] = 255;
	}
	
	zoomPos.left = 0;
	zoomPos.top = 0;
	zoomLevel = 1;
	ctx.putImageData(imgdata, 0, 0);

	$("a.zoomlevel").text("1");
}

/**
* Draw the board at a certain zoom level
*/
function drawZoom(startX, startY, level, owner) {
	var endX = startX + canvasWidth / level;
	var endY = startY + canvasHeight / level;
	var x, y, pixel, index;
	
	zoomPos.left = startX;
	zoomPos.top = startY;

	if(window.localStorage) {
		window.localStorage["viewport"] = zoomPos.left + "," + zoomPos.top + "," + zoomLevel;
	}

	owner = owner || mypixelsSelected && me.userID;
	
	//clear canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	
	//if the zoom level is greater than two, this is more effecient
	if(zoomLevel > 4) {
		for(x = ~~startX; x < endX; ++x) {
			for(y = ~~startY; y < endY; ++y) {
				pixel = board[x + "," + y];
				
				//if no pixel found, don't draw
				if(!pixel && !pixels[x + "," + y]) continue;
				
				//only show existing pixels
				if(owner && !pixel) {
					continue;
				}
				
				//if only draw the specified owner
				if(owner && pixel.owner != owner) {
					continue;
				}
				
				ctx.fillStyle = "#" + (pixels[x + "," + y] ? selectColor : pixel.color);
				ctx.fillRect(
					(x - startX) * level, 
					(y - startY) * level, 
					level, 
					level
				);
			}
		}
	} else {
		var pix, coord;
		for(pix in board) {
			coord = pix.split(",");
			x = +coord[0]; y = +coord[1];
			pixel = board[pix];

			//if only show owners pixels
			if(owner && pixel.owner != owner) continue;

			//if selected, draw later
			if(pixels[pix]) continue;

			if(x >= ~~startX && x <= endX && y >= ~~startY && y <= endY) {
				ctx.fillStyle = "#" + pixel.color;
				ctx.fillRect(
					(x - startX) * level, 
					(y - startY) * level, 
					level, 
					level
				);
			}
		}

		for(var pix in pixels) {
			coord = pix.split(",");
			x = +coord[0]; y = +coord[1];


			if(x >= ~~startX && x <= endX && y >= ~~startY && y <= endY) {
				ctx.fillStyle = "#" + selectColor;
				ctx.fillRect(
					(x - startX) * level, 
					(y - startY) * level, 
					level, 
					level
				);
			}
		}
	}
	
	zoomLevel = level;
	$("a.zoomlevel").text(zoomLevel);
}

function redraw() {
	if(pixels.length) {
		$counter.show().text("(" + pixels.length + ")");
	} else {
		$counter.hide();
	}
	
	if(zoomLevel === 1) {
		drawBoard(mypixelsSelected && me.userID);
	} else {
		drawZoom(zoomPos.left, zoomPos.top, zoomLevel, mypixelsSelected && me.userID);
	}
}

function updateBoard(data) {
	currentTimestamp = data.substr(0, 10);
	parse = data.substr(10);
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
	
	redraw();
}

function applyLogs(logs) {
	if(!logs) return;
	
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