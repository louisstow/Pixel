var canvas, 
	ctx, 
	board, 
	owners, 
	canvasWidth, 
	canvasHeight,
	me,
	stagePos,
	zoomPos = {left: 0, top: 0},
	zoomLevel = 1,
	zoomer,
	selected,
	shadowColor = "#222222";

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
	
	//check if the user is logged in
	api("IsLogged", function(resp) {
		console.log(resp);
		if(resp.error) {
			$("#login,#register").show();
		} else {
			$("#welcome").text("Here be " + resp.userName).show();
			me = resp;
		}
	}, false);
	
	//retrieve the current board
	api("GetBoard", function(data) {
		board = data.pixels;
		owners = data.owners;
		
		drawBoard();
	});
	
	$("#login").click(function() {
		$("div.login").show();
		$("div.register").hide();
	});
	
	$("#register").click(function() {
		$("div.login").hide();
		$("div.register").show();
	});
	
	//user logged in
	$(".login button").click(function() {
		var user = $("div.login .user").val(),
			pass = $("div.login .pass").val();
			
		console.log(user, pass);
		api("Login", {username: user, password: pass}, function(resp) {
			me = resp;
			$("div.register").hide();
			$("div.login").hide();
			$("#login,#register").hide();
			$("#welcome").text("Here be " + resp.userName).show();
		});
	});
	
	//user registered
	$(".register button").click(function() {
		
	});
	
	$("a.zoomin").click(function() {
		drawBoard(selected === "mypixels" && me.userID);
		$(this).text("Zoom In");
	});
	
	$(".x2, .x4, .x8, .x16").click(function() {
		var level = parseInt($(this).attr("class").substr(1), 10);
		console.log(level);

		startZoomer(level);
	});
	
	$("a.mypixels").click(function() {
		if(!me) {
			showError("Please login");
			return;
		}
		clearSelection();
		
		if(selected === "mypixels") {
			$(this).removeClass("active");
			$("#stage").css("background", "transparent");
			selected = null;
		} else {
			$(this).addClass("active");
			$("#stage").css("background", shadowColor);
			selected = "mypixels";
		}
		
		if(zoomLevel === 1) {
			drawBoard(me.userID);
		} else {
			drawZoom(zoomPos.left, zoomPos.top, zoomLevel, me.userID);
		}
	});
});

function clearSelection() {
	$("#stage").unbind().css("background", "transparent");
	$("#controls a").removeClass("active");
}

function startZoomer(level) {
	//reset to 1
	if(zoomLevel !== 1) drawBoard();
	
	selected = "zoom";
	var w = canvasWidth / level,
		h = canvasHeight / level;
		
	$(zoomer).css({
		width: w,
		height: h
	}).show();
	
	$("#stage").mousemove(function(e) {
		$(zoomer).css({
			left: (e.clientX - stagePos.left) - w / 2,
			top: (e.clientY - stagePos.top) - h / 2
		});
	}).click(function(e) {
		console.log(e, stagePos);
		drawZoom(
			((e.clientX - stagePos.left) - w / 2),
			((e.clientY - stagePos.top) - h / 2),
			level
		);
		
		$("a.zoomin").text("Zoom Out");
		stopZoomer();
	});
}

function stopZoomer() {
	$(zoomer).hide();
	$("#stage").unbind("mousemove").unbind("click");
}

function drawBoard(owner) {
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	var imgdata = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	var color;
	var pixel;
	var index;
	var data = imgdata.data;
	
	//loop over board
	for(var pos in board) {
		pixel = board[pos];
		//skip if only drawing owner
		if(owner && pixel.owner != owner) continue;
		
		pos = pos.split(",");
		index = (pos[1] * canvasWidth + (+pos[0])) * 4;
		
		data[index] = parseInt(pixel.color.substr(0, 2), 16);   //red
		data[++index] = parseInt(pixel.color.substr(2, 2), 16); // green
		data[++index] = parseInt(pixel.color.substr(4, 2), 16); // blue
		data[++index] = 255;
	}
	
	zoomPos.left = 0;
	zoomPos.top = 0;
	zoomLevel = 1;
	ctx.putImageData(imgdata, 0, 0);
}

/**
* Draw the board at a certain zoom level
*/
function drawZoom(startX, startY, level, owner) {
	var endX = startX + canvasWidth / level;
	var endY = startY + canvasHeight / level;
	console.log(startX, startY, endX, endY);
	var x, y, pixel, index;
	
	zoomPos.left = startX;
	zoomPos.top = startY;
	
	//clear canvas
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	
	for(x = ~~startX; x < endX; ++x) {
		for(y = ~~startY; y < endY; ++y) {
			pixel = board[x + "," + y];
			
			//if no pixel found, don't draw
			if(!pixel) continue;
			//if only draw the specified owner
			if(owner && pixel.owner != owner) {
				console.log(owner, pixel.owner);
				continue;
			}
			
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
