var canvas, 
	ctx, 
	board, 
	owners, 
	canvasWidth, 
	canvasHeight,
	body,
	me,
	pixels = {length: 0},
	stagePos,
	zoomPos = {left: 0, top: 0},
	zoomLevel = 1,
	zoomer,
	selected, //which tool is selected
	tab, //which tab is selected
	mypixelsSelected = false,
	shadowColor = "#222222",
	selectColor = "00C8FF";

$(function() {
	zoomer = document.createElement("div");
	$("#stage").append(zoomer);
	zoomer.setAttribute("class", "zoomer");
	stagePos = $("#stage").offset();
	stagePos.left++;
	stagePos.top++;
	
	//init canvases
	canvas = $("#canvas")[0];
	ctx = canvas.getContext("2d");
	
	canvasWidth = canvas.width;
	canvasHeight = canvas.height;
	body = document.body;
	
	$(".color").each(function() {
		var self = $(this);
		
		self.ColorPicker({
			onChange: function(hsb, hex, rgb) {
				self.val(hex);
			}
		});
	});
	
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
		clearSelection();
		drawBoard(mypixelsSelected && me.userID);
		$(this).text("Zoom In");
	});
	
	$(".x2, .x4, .x8, .x16").click(function() {
		clearSelection();
		$("a.zoomin").addClass("active");
		
		var level = parseInt($(this).attr("class").substr(1), 10);
		startZoomer(level);
	});
	
	$("a.mypixels").click(function() {
		if(!me) {
			showError("Please login");
			return;
		}
		
		if(mypixelsSelected) {
			$(this).removeClass("active");
			$("#stage").css("background", "transparent");
			mypixelsSelected = false;
		} else {
			$(this).addClass("active");
			$("#stage").css("background", shadowColor);
			mypixelsSelected = true;
		}
		
		redraw();
	});
	
	$("a.select").click(function() {
		clearSelection();
		selected = "select";
		$("#stage").unbind();
		$(this).addClass("active");
		
		$("#stage").mousedown(function(e) {
			//start pixel
			var pos = translate(e.clientX, e.clientY);
			pos.x = ~~pos.x;
			pos.y = ~~pos.y;
			
			var startZoomPos = {
				left: (e.clientX - stagePos.left + body.scrollLeft),
				top: (e.clientY - stagePos.top + body.scrollTop)
			};
			
			//user the zoomer div preview
			$(zoomer).show().css({
				left: startZoomPos.left,
				top: startZoomPos.top,
				width: 1,
				height: 1
			});
			
			//end pixel
			$(this).mousemove(function(d) {
				var currentPos = {
					left: (d.clientX - stagePos.left + body.scrollLeft),
					top: (d.clientY - stagePos.top + body.scrollTop)
				};
				
				$(zoomer).show().css({
					left: Math.min(currentPos.left, startZoomPos.left),
					top: Math.min(currentPos.top, startZoomPos.top),
					width: Math.abs(currentPos.left - startZoomPos.left),
					height: Math.abs(currentPos.top - startZoomPos.top)
				});
			}).mouseup(function(d) {
				var pos2 = translate(d.clientX, d.clientY);
				pos2.x = ~~pos2.x;
				pos2.y = ~~pos2.y;
				var diffx = pos2.x < pos.x ? -1 : 1;
				var diffy = pos2.y < pos.y ? -1 : 1;
				var x = pos.x, y;
				
				$(zoomer).hide();
				
				//if the mouseup is the same position as down, it was a click
				if(~~pos.x === ~~pos2.x && ~~pos.y === ~~pos2.y) {
					console.log("click");
					$(this).unbind("mousemove").unbind("mouseup");
					selectPixel(~~pos.x, ~~pos.y);
					return;
				}
				console.log(pos, pos2, diffx, diffy);
				//loop over the x difference
				while(x !== pos2.x) {
					y = pos.y;
					
					//loop over the y difference
					while(y !== pos2.y) {
						if(!pixels[x + "," + y]) {
							pixels[x + "," + y] = true;
							pixels.length++;
						}
						y += diffy;
					}
					
					x += diffx;
				}
				
				redraw();
			
				$(this).unbind("mousemove").unbind("mouseup");
			});
		});
	});
	
	$("a.clearselection").click(function() {
		pixels = {length: 0 };
		redraw();
	});
	
	$("a.selectmypixels").click(function() {
		if(!me) {
			showError("Please login");
			return;
		}
		
		pixels = {length: 0};
		for(var pos in board) {
			pixels[pos] = true;
			pixels.length++;
		}
		
		redraw();
	});
});

function clearSelection() {
	$("#tools a").removeClass("active");
	selected = null;
	stopZoomer();
	$("#stage").unbind("mousedown");
}

function selectPixel(x, y) {
	if(x < 0 || y < 0) {
		showError("Pixel out of bounds");
		return;
	}
		
	var key = x + "," + y;
	console.log(key);
	if(pixels[key]) {
		delete pixels[key];
		pixels.length--;
	} else {
		pixels[key] = true;
		pixels.length++;
	}
	
	redraw();
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
			left: (e.clientX - stagePos.left + body.scrollLeft) - w / 2,
			top: (e.clientY - stagePos.top + body.scrollTop) - h / 2
		});
	}).click(function(e) {
		console.log(e, stagePos);
		drawZoom(
			((e.clientX - stagePos.left + body.scrollLeft) - w / 2),
			((e.clientY - stagePos.top + body.scrollTop) - h / 2),
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
		color = pixels[pos] ? selectColor : pixel.color;
		
		data[index] = parseInt(color.substr(0, 2), 16);   //red
		data[++index] = parseInt(color.substr(2, 2), 16); // green
		data[++index] = parseInt(color.substr(4, 2), 16); // blue
		data[++index] = 255;
	}
	
	//loop over selected pixels
	for(var pos in pixels) {
		pixel = board[pos];

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
			if(!pixel && !pixels[x + "," + y]) continue;
			//if only draw the specified owner
			if(owner && pixel.owner != owner) {
				console.log(owner, pixel.owner);
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
	
	zoomLevel = level;
}

function redraw() {
	if(zoomLevel === 1) {
		drawBoard(mypixelsSelected && me.userID);
	} else {
		drawZoom(zoomPos.left, zoomPos.top, zoomLevel, mypixelsSelected && me.userID);
	}
}

function translate(x, y) {
	return {
		x: (x - stagePos.left + body.scrollLeft) / zoomLevel + zoomPos.left,
		y: (y - stagePos.top + body.scrollTop) / zoomLevel + zoomPos.top
	}
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
