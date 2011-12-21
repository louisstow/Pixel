var canvas, 
	ctx, 
	board, 
	owners, 
	canvasWidth, 
	canvasHeight,
	stagePos,
	zoomLevel = 1,
	zoomer,
	selected;

$(function() {
	zoomer = document.createElement("div");
	$("#stage").append(zoomer);
	zoomer.setAttribute("class", "zoomer");
	stagePos = $("#stage").offset();
	
	//init canvases
	canvas = $("#canvas")[0];
	ctx = canvas.getContext("2d");
	
	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	
	//retrieve the current board
	api("GetBoard", function(data) {
		board = data.pixels;
		owners = data.owners;
		
		drawBoard();
	});
	
	//user logged in
	$(".login button").click(function() {
		
	});
	
	//user registered
	$(".register button").click(function() {
		
	});
	
	$(".x2, .x4, .x8, .x16").click(function() {
		var level = parseInt($(this).attr("class").substr(1), 10);
		console.log(level);

		startZoomer(level);
		
	});
});

function startZoomer(level) {
	selected = "zoom";
	var w = canvasWidth / level,
		h = canvasHeight / level;
		
	$(zoomer).show().css({
		width: w,
		height: h
	});
	
	$("#stage").mousemove(function(e) {
		$(zoomer).css({
			left: (e.clientX - stagePos.left) - w / 2,
			top: (e.clientY - stagePos.top) - h / 2
		});
	}).click(function(e) {
		console.log(e, stagePos);
		drawZoom(
			(e.clientX - stagePos.left) - w / 2,
			(e.clientY - stagePos.top) - h / 2,
			level
		);
	});;
}

function drawBoard() {
	var imgdata = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	var color;
	var pixel;
	var index;
	var data = imgdata.data;
	
	//loop over board
	for(var pos in board) {
		pixel = board[pos];
		pos = pos.split(",");
		index = (pos[1] * canvasWidth + (+pos[0])) * 4;
		
		data[index] = parseInt(pixel.color.substr(0, 2), 16);   //red
		data[++index] = parseInt(pixel.color.substr(2, 2), 16); // green
		data[++index] = parseInt(pixel.color.substr(4, 2), 16); // blue
		data[++index] = 255;
	}
	
	zoomLevel = 1;
	ctx.putImageData(imgdata, 0, 0);
}

/**
* Draw the board at a certain zoom level
*/
function drawZoom(startX, startY, level) {
	var endX = startX + canvasWidth / level;
	var endY = startY + canvasHeight / level;
	console.log(startX, startY, endX, endY);
	var x, y, pixel, index;
	
	//clear canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	
	for(x = ~~startX; x < endX; ++x) {
		for(y = ~~startY; y < endY; ++y) {
			pixel = board[x + "," + y];
			if(!pixel) continue;
			
			console.log(pixel, x, y);
			ctx.fillStyle = "#" + pixel.color;
			ctx.fillRect(
				(x - startX) * level, 
				(y - startY) * level, 
				level, 
				level
			);
		}
	}
	
	zoomLevel = level;
}

function showError(msg) {
	console.error(msg);
}

function api(action, data, callback, showError) {
	//allow empty data
	if(typeof data === "function") {
		showError = callback;
		callback = data;
		data = null;
	}
	
	//default to show error
	if(showError === undefined) {
		showError = true;
	}
	
	$.ajax("api.php?action=" + action, {
		dataType: "json",
		data: data,
		success: function(data) {
			//if there is an error, automatically display
			if(showError && data.error) {
				showError(data.error);
				return;
			}
			
			if(callback) callback(data);
		}
	});
};
